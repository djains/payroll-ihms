package com.ngglobal

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

class ShiftTrackingService : Service() {

    companion object {
        private const val TAG = "ShiftTrackingService"
        private const val CHANNEL_ID = "shift_tracking_channel"
        private const val NOTIFICATION_ID = 9401
        const val PREFS_NAME = "ShiftTrackingPrefs"

        const val KEY_ACTIVE = "is_active"
        const val KEY_EMP_CODE = "emp_code"
        const val KEY_BASE_URL = "base_url"
        const val KEY_API_KEY = "api_key"
        const val KEY_UNIT_NAME = "unit_name"
        const val KEY_UNIT_LAT = "unit_lat"
        const val KEY_UNIT_LON = "unit_lon"

        const val ACTION_START = "com.ngglobal.ACTION_START_TRACKING"
        const val ACTION_STOP = "com.ngglobal.ACTION_STOP_TRACKING"
    }

    private var locationManager: LocationManager? = null
    private val executor = Executors.newSingleThreadExecutor()
    private val isSending = AtomicBoolean(false)

    private var empCode: String = ""
    private var baseUrl: String = ""
    private var apiKey: String = ""
    private var unitName: String = "Field Location"
    private var unitLat: Double = 0.0
    private var unitLon: Double = 0.0

    private var lastLoggedLat: Double = 0.0
    private var lastLoggedLon: Double = 0.0
    private var isOutsideUnit: Boolean = false
    private var cachedAddress: String = ""
    private var lastReverseGeoTimeMs: Long = 0L
    private var lastPingSentTimeMs: Long = 0L

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            handleLocation(location)
        }

        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    override fun onCreate() {
        super.onCreate()
        locationManager = getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTrackingInternal()
            return START_NOT_STICKY
        }

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (intent != null && intent.action == ACTION_START) {
            empCode = intent.getStringExtra(KEY_EMP_CODE) ?: ""
            baseUrl = intent.getStringExtra(KEY_BASE_URL) ?: ""
            apiKey = intent.getStringExtra(KEY_API_KEY) ?: ""
            unitName = intent.getStringExtra(KEY_UNIT_NAME) ?: "Field Location"
            unitLat = intent.getDoubleExtra(KEY_UNIT_LAT, 0.0)
            unitLon = intent.getDoubleExtra(KEY_UNIT_LON, 0.0)

            prefs.edit()
                .putBoolean(KEY_ACTIVE, true)
                .putString(KEY_EMP_CODE, empCode)
                .putString(KEY_BASE_URL, baseUrl)
                .putString(KEY_API_KEY, apiKey)
                .putString(KEY_UNIT_NAME, unitName)
                .putString(KEY_UNIT_LAT, unitLat.toString())
                .putString(KEY_UNIT_LON, unitLon.toString())
                .apply()
        } else {
            // Restarted by OS after app kill / memory reclaim (START_STICKY)
            val isActive = prefs.getBoolean(KEY_ACTIVE, false)
            if (!isActive) {
                stopSelf()
                return START_NOT_STICKY
            }
            empCode = prefs.getString(KEY_EMP_CODE, "") ?: ""
            baseUrl = prefs.getString(KEY_BASE_URL, "") ?: ""
            apiKey = prefs.getString(KEY_API_KEY, "") ?: ""
            unitName = prefs.getString(KEY_UNIT_NAME, "Field Location") ?: "Field Location"
            unitLat = prefs.getString(KEY_UNIT_LAT, "0.0")?.toDoubleOrNull() ?: 0.0
            unitLon = prefs.getString(KEY_UNIT_LON, "0.0")?.toDoubleOrNull() ?: 0.0
        }

        if (empCode.isBlank() || baseUrl.isBlank()) {
            stopSelf()
            return START_NOT_STICKY
        }

        startAsForeground()
        startLocationUpdates()
        return START_STICKY
    }

    private fun startAsForeground() {
        val notification = buildNotification()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (se: SecurityException) {
            Log.w(TAG, "Missing location permission for foreground service", se)
            stopSelf()
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start foreground service", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Duty Shift Live Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active shift GPS tracking notification"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = launchIntent?.let {
            PendingIntent.getActivity(this, 0, it, pendingFlags)
        }

        val iconRes = applicationInfo.icon.takeIf { it != 0 }
            ?: android.R.drawable.ic_menu_mylocation

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        builder
            .setContentTitle("Duty Shift Active")
            .setContentText("Live GPS tracking is running for $empCode")
            .setSmallIcon(iconRes)
            .setOngoing(true)

        if (pendingIntent != null) {
            builder.setContentIntent(pendingIntent)
        }

        return builder.build()
    }

    private fun hasLocationPermission(): Boolean {
        val fine = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        } else true
        val coarse = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        } else true
        return fine || coarse
    }

    private fun startLocationUpdates() {
        if (!hasLocationPermission()) {
            Log.w(TAG, "Location permission not granted; stopping tracking")
            stopTrackingInternal()
            return
        }

        val lm = locationManager ?: return
        try {
            lm.removeUpdates(locationListener)
        } catch (_: Exception) {}

        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    15_000L,
                    20f, // Movement-based (smallestDisplacement = 20m)
                    locationListener,
                    Looper.getMainLooper()
                )
            }
        } catch (e: SecurityException) {
            Log.w(TAG, "GPS provider permission denied", e)
        } catch (e: Exception) {
            Log.w(TAG, "GPS provider error", e)
        }

        try {
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    20_000L,
                    20f, // Movement-based (smallestDisplacement = 20m)
                    locationListener,
                    Looper.getMainLooper()
                )
            }
        } catch (e: SecurityException) {
            Log.w(TAG, "Network provider permission denied", e)
        } catch (e: Exception) {
            Log.w(TAG, "Network provider error", e)
        }
    }

    private fun handleLocation(location: Location) {
        // 1. Block Mock / Fake GPS locations
        val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            @Suppress("DEPRECATION")
            location.isFromMockProvider
        }
        if (isMock) {
            Log.w(TAG, "Mock/Fake GPS location rejected")
            return
        }

        // 2. Reject low-accuracy GPS readings (> 30 meters) to avoid false jumps
        if (location.hasAccuracy() && location.accuracy > 30f) {
            return
        }

        val currentLat = location.latitude
        val currentLon = location.longitude
        if (currentLat == 0.0 || currentLon == 0.0) return

        // Enforce 30-second minimum cooldown to prevent repeated API spam
        val nowMs = System.currentTimeMillis()
        if (lastPingSentTimeMs > 0L && (nowMs - lastPingSentTimeMs) < 30_000L) {
            return
        }

        // 3. Movement Tracker with Hysteresis (20m inside, >30m outside to prevent boundary flip-flop)
        if (unitLat != 0.0 && unitLon != 0.0) {
            val distFromUnit = getDistanceMeters(currentLat, currentLon, unitLat, unitLon)
            if (distFromUnit <= 20.0) {
                isOutsideUnit = false
                lastLoggedLat = 0.0
                lastLoggedLon = 0.0
                return
            }

            if (!isOutsideUnit) {
                // Only trigger out-of-location ping if strictly > 30m (prevents 20m jitter spam)
                if (distFromUnit > 30.0) {
                    isOutsideUnit = true
                    val distText = "${distFromUnit.roundToInt()}m from site"
                    sendPingToBackend(currentLat, currentLon, distText)
                }
                return
            }
        }

        if (lastLoggedLat != 0.0) {
            val distFromLast = getDistanceMeters(currentLat, currentLon, lastLoggedLat, lastLoggedLon)
            if (distFromLast >= 20.0) {
                sendPingToBackend(currentLat, currentLon, "Moved +${distFromLast.roundToInt()}m")
            }
        } else {
            sendPingToBackend(currentLat, currentLon, "On-field tracking")
        }
    }

    private fun sendPingToBackend(lat: Double, lon: Double, distanceInfo: String) {
        if (!isSending.compareAndSet(false, true)) return

        executor.execute {
            try {
                val nowMs = System.currentTimeMillis()
                if (cachedAddress.isBlank() || (nowMs - lastReverseGeoTimeMs) > 300_000L) {
                    val resolved = reverseGeocode(lat, lon)
                    if (!resolved.isNullOrBlank()) {
                        cachedAddress = resolved.take(200)
                        lastReverseGeoTimeMs = nowMs
                    }
                }

                val addr = if (cachedAddress.isNotBlank()) {
                    "$cachedAddress ($distanceInfo)"
                } else {
                    "$unitName • $distanceInfo"
                }

                val cleanBase = baseUrl.trimEnd('/')
                val endpoint = "$cleanBase/api/mobile/Employee_geolocation_lat_long/"
                val url = URL(endpoint)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Accept", "application/json")
                    if (apiKey.isNotBlank()) {
                        setRequestProperty("X-API-Key", apiKey)
                    }
                }

                val body = JSONObject().apply {
                    put("emp_code", empCode)
                    put("emp_latitude", String.format(java.util.Locale.US, "%.6f", lat))
                    put("emp_longtitude", String.format(java.util.Locale.US, "%.6f", lon))
                    put("current_address", addr.take(250))
                }.toString()

                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                    writer.write(body)
                    writer.flush()
                }

                val code = conn.responseCode
                conn.disconnect()

                if (code in 200..299) {
                    lastLoggedLat = lat
                    lastLoggedLon = lon
                    lastPingSentTimeMs = System.currentTimeMillis()
                    Log.d(TAG, "Background GPS ping sent ($code): $lat, $lon")
                } else {
                    Log.w(TAG, "Background GPS ping HTTP $code")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Background GPS ping error", e)
            } finally {
                isSending.set(false)
            }
        }
    }

    private fun reverseGeocode(lat: Double, lon: Double): String? {
        return try {
            val geoUrl = URL(
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=18&addressdetails=1"
            )
            val conn = (geoUrl.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 4_000
                readTimeout = 4_000
                setRequestProperty("User-Agent", "IHMS-Mobile-App/1.0")
            }
            if (conn.responseCode in 200..299) {
                val resp = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()
                val json = JSONObject(resp)
                json.optString("display_name", "").trim().takeIf { it.isNotEmpty() }
            } else {
                conn.disconnect()
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun getDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371e3
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
            sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    private fun stopTrackingInternal() {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ACTIVE, false)
            .apply()

        try {
            locationManager?.removeUpdates(locationListener)
        } catch (_: Exception) {}

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        try {
            locationManager?.removeUpdates(locationListener)
        } catch (_: Exception) {}
        executor.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
