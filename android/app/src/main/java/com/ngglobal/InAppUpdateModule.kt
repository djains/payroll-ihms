package com.ngglobal

import android.app.Activity
import android.content.Intent
import android.content.IntentSender.SendIntentException
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

class InAppUpdateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val appUpdateManager: AppUpdateManager by lazy {
        AppUpdateManagerFactory.create(reactContext)
    }

    private var cachedUpdateInfo: AppUpdateInfo? = null
    private var pendingUpdatePromise: Promise? = null
    private val UPDATE_REQUEST_CODE = 9001

    private val installStateUpdatedListener = InstallStateUpdatedListener { state ->
        val map = Arguments.createMap().apply {
            putInt("status", state.installStatus())
            putDouble("bytesDownloaded", state.bytesDownloaded().toDouble())
            putDouble("totalBytesToDownload", state.totalBytesToDownload().toDouble())
        }
        if (state.installStatus() == InstallStatus.DOWNLOADED) {
            sendEvent("onUpdateDownloaded", map)
        } else if (state.installStatus() == InstallStatus.DOWNLOADING) {
            sendEvent("onUpdateProgress", map)
        }
    }

    init {
        reactContext.addActivityEventListener(this)
        try {
            appUpdateManager.registerListener(installStateUpdatedListener)
        } catch (_: Exception) {}
    }

    override fun getName(): String = "InAppUpdateModule"

    @ReactMethod
    fun checkNeedsUpdate(promise: Promise) {
        try {
            val packageInfo = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                reactContext.packageManager.getPackageInfo(
                    reactContext.packageName,
                    android.content.pm.PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
            }

            val currentVersionCode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }
            val currentVersionName = packageInfo.versionName ?: "1.0"

            val appUpdateInfoTask = appUpdateManager.appUpdateInfo
            appUpdateInfoTask.addOnSuccessListener { info ->
                this.cachedUpdateInfo = info
                val isAvailable = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                val isImmediateAllowed = info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
                val isFlexibleAllowed = info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)

                val map = Arguments.createMap().apply {
                    putBoolean("shouldUpdate", isAvailable)
                    putInt("availableVersionCode", info.availableVersionCode())
                    putInt("currentVersionCode", currentVersionCode)
                    putString("currentVersionName", currentVersionName)
                    putString("packageName", reactContext.packageName)
                    putBoolean("isImmediateAllowed", isImmediateAllowed)
                    putBoolean("isFlexibleAllowed", isFlexibleAllowed)
                }
                promise.resolve(map)
            }.addOnFailureListener { e ->
                promise.reject("CHECK_UPDATE_FAILED", e.message, e)
            }
        } catch (e: Exception) {
            promise.reject("CHECK_UPDATE_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun startUpdate(updateTypeStr: String, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }
        val info = cachedUpdateInfo
        if (info == null) {
            promise.reject("NO_UPDATE_INFO", "Please call checkNeedsUpdate first")
            return
        }

        val type = if (updateTypeStr.equals("IMMEDIATE", ignoreCase = true)) {
            AppUpdateType.IMMEDIATE
        } else {
            AppUpdateType.FLEXIBLE
        }

        if (!info.isUpdateTypeAllowed(type)) {
            promise.reject("UPDATE_TYPE_NOT_ALLOWED", "Update type $updateTypeStr is not allowed")
            return
        }

        this.pendingUpdatePromise = promise
        try {
            appUpdateManager.startUpdateFlowForResult(
                info,
                type,
                activity,
                UPDATE_REQUEST_CODE
            )
        } catch (e: SendIntentException) {
            this.pendingUpdatePromise = null
            promise.reject("START_FLOW_FAILED", e.message, e)
        } catch (e: Exception) {
            this.pendingUpdatePromise = null
            promise.reject("START_FLOW_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun completeUpdate(promise: Promise) {
        try {
            appUpdateManager.completeUpdate()
                .addOnSuccessListener {
                    promise.resolve(true)
                }
                .addOnFailureListener { e ->
                    promise.reject("COMPLETE_UPDATE_FAILED", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("COMPLETE_UPDATE_EXCEPTION", e.message, e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == UPDATE_REQUEST_CODE) {
            val p = pendingUpdatePromise
            pendingUpdatePromise = null
            if (resultCode == Activity.RESULT_OK) {
                p?.resolve("OK")
            } else if (resultCode == Activity.RESULT_CANCELED) {
                p?.resolve("CANCELED")
            } else {
                p?.resolve("FAILED")
            }
        }
    }

    override fun onNewIntent(intent: Intent) {}

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
            }
        } catch (_: Exception) {}
    }
}
