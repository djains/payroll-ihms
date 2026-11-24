# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in proguard-android-optimize.txt.

# -------------------------------------------------------------
# 1. React Native Official JNI & Bridge Rules
# -------------------------------------------------------------
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.react.uimanager.annotations.ReactProp
-keep,allowobfuscation @interface com.facebook.react.uimanager.annotations.ReactPropGroup

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}

# Keep JNI methods & React annotations
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }

# Keep NativeModule and JavaScriptModule classes
-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }

-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }
-keep,includedescriptorclasses class com.facebook.react.turbomodule.core.** { *; }
-keep,includedescriptorclasses class com.facebook.react.internal.turbomodule.core.** { *; }

# Hermes JNI
-keep class com.facebook.jni.** { *; }

# Yoga
-keep,allowobfuscation @interface com.facebook.yoga.annotations.DoNotStrip
-keep @com.facebook.yoga.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.yoga.annotations.DoNotStrip *;
}

# Fresco & Image Utils
-keep class com.facebook.imageutils.** { *; }

# -------------------------------------------------------------
# 2. Custom Native Modules (IHMS App)
# -------------------------------------------------------------
-keep class com.ngglobal.** { *; }
-keepclassmembers class com.ngglobal.** {
    @com.facebook.react.bridge.ReactMethod *;
    public <methods>;
}

# -------------------------------------------------------------
# 3. Google Play In-App Updates SDK
# -------------------------------------------------------------
-keep class com.google.android.play.core.appupdate.** { *; }
-keep class com.google.android.play.core.install.** { *; }
-keep interface com.google.android.play.core.appupdate.** { *; }
-keep interface com.google.android.play.core.install.** { *; }
-keep class com.google.android.play.core.tasks.** { *; }

# -------------------------------------------------------------
# 4. Third-Party React Native Libraries (Keep entrypoints only)
# -------------------------------------------------------------
# React Native Screens
-keep class com.swmansion.rnscreens.**Screen* { *; }
-keep class com.swmansion.rnscreens.**ScreenContainer* { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }

# React Native NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# -------------------------------------------------------------
# 5. Suppress Third-Party Missing References Warnings
# -------------------------------------------------------------
-dontwarn com.facebook.react.**
-dontwarn com.swmansion.**
-dontwarn com.google.android.play.core.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
