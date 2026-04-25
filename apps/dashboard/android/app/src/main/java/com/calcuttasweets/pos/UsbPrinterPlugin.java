package com.calcuttasweets.pos;

import android.content.Context;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.util.Base64;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;

@CapacitorPlugin(name = "UsbPrinter")
public class UsbPrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("Missing `data` (base64 ESC/POS payload).");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            UsbManager usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
            if (usbManager == null) {
                call.reject("USB manager unavailable");
                return;
            }

            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            if (deviceList == null || deviceList.isEmpty()) {
                call.reject("No USB device found");
                return;
            }

            for (UsbDevice device : deviceList.values()) {
                for (int i = 0; i < device.getInterfaceCount(); i++) {
                    UsbInterface usbInterface = device.getInterface(i);
                    UsbEndpoint outEndpoint = null;

                    for (int e = 0; e < usbInterface.getEndpointCount(); e++) {
                        UsbEndpoint endpoint = usbInterface.getEndpoint(e);
                        if (endpoint.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK
                                && endpoint.getDirection() == UsbConstants.USB_DIR_OUT) {
                            outEndpoint = endpoint;
                            break;
                        }
                    }

                    if (outEndpoint == null) {
                        continue;
                    }

                    if (!usbManager.hasPermission(device)) {
                        call.reject("USB permission not granted. Allow device access and retry.");
                        return;
                    }

                    UsbDeviceConnection connection = usbManager.openDevice(device);
                    if (connection == null) {
                        continue;
                    }

                    try {
                        if (!connection.claimInterface(usbInterface, true)) {
                            continue;
                        }
                        int written = connection.bulkTransfer(outEndpoint, bytes, bytes.length, 4000);
                        if (written <= 0) {
                            call.reject("Failed to write to USB printer.");
                            return;
                        }
                        call.resolve();
                        return;
                    } finally {
                        try {
                            connection.releaseInterface(usbInterface);
                        } catch (Exception ignored) {
                        }
                        connection.close();
                    }
                }
            }

            call.reject("No compatible USB printer endpoint found");
        } catch (Exception e) {
            call.reject("USB print failed: " + e.getMessage());
        }
    }
}
