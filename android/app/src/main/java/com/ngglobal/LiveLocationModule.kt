package com.ngglobal

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LiveLocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LiveLocationModule"

    @ReactMethod
    fun startTracking(
        empCode: String,
        baseUrl: String,
        apiKey: String,
        unitName: String,
        unitLat: Double,
        unitLon: Double,
        promise: Promise?
    ) {
        try {
            val intent = Intent(reactContext, ShiftTrackingService::class.java).apply {
                action = ShiftTrackingService.ACTION_START
                putExtra(ShiftTrackingService.KEY_EMP_CODE, empCode)
                putExtra(ShiftTrackingService.KEY_BASE_URL, baseUrl)
                putExtra(ShiftTrackingService.KEY_API_KEY, apiKey)
                putExtra(ShiftTrackingService.KEY_UNIT_NAME, unitName)
                putExtra(ShiftTrackingService.KEY_UNIT_LAT, unitLat)
                putExtra(ShiftTrackingService.KEY_UNIT_LON, unitLon)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("START_TRACKING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise?) {
        try {
            val intent = Intent(reactContext, ShiftTrackingService::class.java).apply {
                action = ShiftTrackingService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise?.resolve(true)
        } catch (e: Exception) {
            try {
                reactContext.stopService(Intent(reactContext, ShiftTrackingService::class.java))
            } catch (_: Exception) {}
            promise?.resolve(false)
        }
    }
}
