package no.akselsen.soluteliv;

import android.content.res.AssetManager;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Ultralett innebygd HTTP-tjener på 127.0.0.1.
 * Sikrer at WebView kjører i en W3C "Secure Context" (localhost),
 * slik at navigator.mediaDevices.getUserMedia (kamera) og WebRTC fungerer
 * 100% uten begrensningene som gjelder for file:///android_asset/.
 */
public class LocalAssetServer {

    private static final String TAG = "LocalAssetServer";
    private final AssetManager assetManager;
    private ServerSocket serverSocket;
    private ExecutorService threadPool;
    private volatile boolean isRunning = false;
    private int port = 8765;

    public LocalAssetServer(AssetManager assetManager) {
        this.assetManager = assetManager;
    }

    public synchronized boolean start() {
        if (isRunning) return true;
        try {
            serverSocket = new ServerSocket(port, 50, InetAddress.getByName("127.0.0.1"));
            isRunning = true;
            threadPool = Executors.newFixedThreadPool(6);
            threadPool.execute(this::listen);
            Log.i(TAG, "LocalAssetServer startet på port " + port);
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Port " + port + " opptatt, velger ledig port: " + e.getMessage());
            try {
                serverSocket = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
                this.port = serverSocket.getLocalPort();
                isRunning = true;
                threadPool = Executors.newFixedThreadPool(6);
                threadPool.execute(this::listen);
                Log.i(TAG, "LocalAssetServer startet på dynamisk port " + port);
                return true;
            } catch (Exception ex) {
                Log.e(TAG, "Kunne ikke starte LocalAssetServer", ex);
                return false;
            }
        }
    }

    public int getPort() {
        return port;
    }

    public boolean isRunning() {
        return isRunning;
    }

    private void listen() {
        while (isRunning && serverSocket != null && !serverSocket.isClosed()) {
            try {
                final Socket client = serverSocket.accept();
                if (threadPool != null && !threadPool.isShutdown()) {
                    threadPool.execute(() -> handleClient(client));
                }
            } catch (IOException e) {
                if (!isRunning) break;
            }
        }
    }

    private void handleClient(Socket socket) {
        try {
            socket.setSoTimeout(5000);
            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();

            StringBuilder sb = new StringBuilder();
            int b;
            while ((b = in.read()) != -1) {
                sb.append((char) b);
                if (sb.toString().endsWith("\r\n\r\n") || sb.toString().endsWith("\n\n")) {
                    break;
                }
                if (sb.length() > 4096) break;
            }

            String requestStr = sb.toString();
            String[] lines = requestStr.split("\r\n");
            if (lines.length == 0 || !lines[0].startsWith("GET")) {
                sendResponse(out, 400, "text/plain", "Bad Request".getBytes("UTF-8"));
                socket.close();
                return;
            }

            String[] parts = lines[0].split(" ");
            if (parts.length < 2) {
                sendResponse(out, 400, "text/plain", "Bad Request".getBytes("UTF-8"));
                socket.close();
                return;
            }

            String path = parts[1];
            int qIdx = path.indexOf('?');
            if (qIdx != -1) path = path.substring(0, qIdx);
            int hIdx = path.indexOf('#');
            if (hIdx != -1) path = path.substring(0, hIdx);

            if (path.isEmpty() || path.equals("/")) {
                path = "/index.html";
            }

            String assetPath = path.startsWith("/") ? path.substring(1) : path;
            InputStream assetStream = null;
            try {
                assetStream = assetManager.open(assetPath);
            } catch (IOException notFound) {
                // SPA fallback for ruter uten filendelse
                if (!assetPath.contains(".")) {
                    try {
                        assetStream = assetManager.open("index.html");
                        assetPath = "index.html";
                    } catch (IOException ignored) {}
                }
            }

            if (assetStream == null) {
                sendResponse(out, 404, "text/plain", "Not Found".getBytes("UTF-8"));
                socket.close();
                return;
            }

            byte[] body = readAll(assetStream);
            assetStream.close();

            String mime = getMimeType(assetPath);
            sendResponse(out, 200, mime, body);
            socket.close();
        } catch (Exception e) {
            try { socket.close(); } catch (Exception ignored) {}
        }
    }

    private void sendResponse(OutputStream out, int status, String mime, byte[] body) throws IOException {
        String statusText = (status == 200) ? "OK" : (status == 404 ? "Not Found" : "Error");
        String header = "HTTP/1.1 " + status + " " + statusText + "\r\n"
                + "Content-Type: " + mime + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Access-Control-Allow-Origin: *\r\n"
                + "Connection: close\r\n\r\n";
        out.write(header.getBytes("UTF-8"));
        out.write(body);
        out.flush();
    }

    private byte[] readAll(InputStream is) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[8192];
        int nRead;
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    private String getMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    public synchronized void stop() {
        isRunning = false;
        if (serverSocket != null) {
            try { serverSocket.close(); } catch (Exception ignored) {}
        }
        if (threadPool != null) {
            threadPool.shutdownNow();
        }
        Log.i(TAG, "LocalAssetServer stoppet");
    }
}
