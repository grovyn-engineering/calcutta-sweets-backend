package com.calcuttasweets.pos;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String START_URL = "https://calcutta-sweets.vercel.app/tablet-legacy";
    private static final String TAG = "CSWebView";
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView.setWebContentsDebuggingEnabled(true);

        webView = findViewById(R.id.webview);
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                    if (consoleMessage != null) {
                        Log.e(
                                TAG,
                                "console[" + consoleMessage.messageLevel() + "] "
                                        + consoleMessage.sourceId()
                                        + ":" + consoleMessage.lineNumber()
                                        + " " + consoleMessage.message()
                        );
                    }
                    return super.onConsoleMessage(consoleMessage);
                }
            });
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.i(TAG, "pageFinished url=" + url);
                }

                @Override
                public void onReceivedError(
                        WebView view,
                        WebResourceRequest request,
                        WebResourceError error
                ) {
                    super.onReceivedError(view, request, error);
                    Log.e(
                            TAG,
                            "receivedError url="
                                    + (request != null ? request.getUrl() : "unknown")
                                    + " code="
                                    + (error != null ? error.getErrorCode() : "unknown")
                                    + " desc="
                                    + (error != null ? error.getDescription() : "unknown")
                    );
                }

                @Override
                public void onReceivedHttpError(
                        WebView view,
                        WebResourceRequest request,
                        WebResourceResponse errorResponse
                ) {
                    super.onReceivedHttpError(view, request, errorResponse);
                    Log.e(
                            TAG,
                            "httpError url="
                                    + (request != null ? request.getUrl() : "unknown")
                                    + " status="
                                    + (errorResponse != null ? errorResponse.getStatusCode() : "unknown")
                    );
                }
            });
            webView.loadUrl(START_URL);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
