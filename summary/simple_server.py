#!/usr/bin/env python3
"""
Simple HTTP server to fix 404 errors for staff dashboard
"""

import http.server
import socketserver
import webbrowser
import time
import threading

PORT = 3005

def start_server():
    """Start simple HTTP server"""
    
    print("🚀 STARTING SIMPLE HTTP SERVER")
    print("=" * 50)
    print(f"📂 Serving files from current directory")
    print(f"🌐 Server will run at: http://localhost:{PORT}")
    print(f"📄 Staff Dashboard: http://localhost:{PORT}/staff_dashboard.html")
    print()
    print("⚠️  Make sure backend is running: python backend/app.py")
    print("⚠️  Press Ctrl+C to stop this server")
    print()
    
    # Auto-open browser after 2 seconds
    def open_browser():
        time.sleep(2)
        try:
            webbrowser.open(f'http://localhost:{PORT}/staff_dashboard.html')
            print(f"🌐 Opened staff dashboard in browser")
        except:
            print(f"⚠️  Could not auto-open browser")
    
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
            print("✅ Server started successfully!")
            print("🎯 Staff dashboard should open automatically!")
            print("=" * 50)
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use!")
            print(f"💡 Stop the existing server or use a different port")
        else:
            print(f"❌ Server error: {e}")
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")

if __name__ == '__main__':
    start_server()
