package com.ngglobal

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.util.Base64
import android.webkit.WebView
import android.webkit.WebViewClient
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class PrintPdfModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrintPdfModule"

    @ReactMethod
    fun print(html: String, jobName: String, promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        Handler(Looper.getMainLooper()).post {
            try {
                val webView = WebView(activity)
                webView.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        try {
                            val printManager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                            val printAdapter = webView.createPrintDocumentAdapter(jobName)
                            printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
                            promise.resolve(true)
                        } catch (e: Exception) {
                            promise.reject("PRINT_ERROR", e.message, e)
                        }
                    }
                }
                webView.loadDataWithBaseURL("https://localhost", html, "text/html", "utf-8", null)
            } catch (e: Exception) {
                promise.reject("INIT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun printPdfBase64(base64Data: String, jobName: String, promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        Handler(Looper.getMainLooper()).post {
            try {
                val cleanBase64 = if (base64Data.contains(",")) {
                    base64Data.substringAfter(",")
                } else {
                    base64Data
                }
                val pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                val tempFile = File(activity.cacheDir, "$jobName.pdf")
                tempFile.writeBytes(pdfBytes)

                val printManager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val printAdapter = object : PrintDocumentAdapter() {
                    override fun onLayout(
                        oldAttributes: PrintAttributes?,
                        newAttributes: PrintAttributes?,
                        cancellationSignal: CancellationSignal?,
                        callback: LayoutResultCallback?,
                        extras: Bundle?
                    ) {
                        if (cancellationSignal?.isCanceled == true) {
                            callback?.onLayoutCancelled()
                            return
                        }
                        val info = PrintDocumentInfo.Builder("$jobName.pdf")
                            .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                            .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                            .build()
                        callback?.onLayoutFinished(info, true)
                    }

                    override fun onWrite(
                        pages: Array<out PageRange>?,
                        destination: ParcelFileDescriptor?,
                        cancellationSignal: CancellationSignal?,
                        callback: WriteResultCallback?
                    ) {
                        try {
                            FileInputStream(tempFile).use { input ->
                                FileOutputStream(destination?.fileDescriptor).use { output ->
                                    input.copyTo(output)
                                }
                            }
                            callback?.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
                        } catch (e: Exception) {
                            callback?.onWriteFailed(e.message)
                        }
                    }
                }

                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PRINT_PDF_ERROR", e.message, e)
            }
        }
    }
}
