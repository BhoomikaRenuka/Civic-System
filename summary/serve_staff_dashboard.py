#!/usr/bin/env python3
"""
Simple HTTP server to serve the staff dashboard HTML file
This fixes the 404 error by properly serving static files
"""

import http.server
import socketserver
import os
import webbrowser
import time
import threading

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.end_headers()

def start_server(port=3005):
    """Start HTTP server to serve staff dashboard"""
    
    print(f"🚀 STARTING STAFF DASHBOARD SERVER")
    print("=" * 60)
    
    # Change to the directory containing the HTML files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully!")
            print(f"📂 Serving files from: {os.getcwd()}")
            print(f"🌐 Server running at: http://localhost:{port}")
            print(f"📄 Staff Dashboard: http://localhost:{port}/staff_dashboard.html")
            print(f"📄 Test Frontend: http://localhost:{port}/test_frontend.html")
            print(f"📄 Admin Test: http://localhost:{port}/test_admin_dashboard.html")
            print()
            print("🔧 Available Files:")
            
            # List available HTML files
            html_files = [f for f in os.listdir('.') if f.endswith('.html')]
            for file in sorted(html_files):
                print(f"   📄 http://localhost:{port}/{file}")
            
            print()
            print("⚠️  IMPORTANT:")
            print("   - Make sure backend is running: python backend/app.py")
            print("   - Backend should be on: http://localhost:5000")
            print("   - Press Ctrl+C to stop this server")
            print()
            
            # Auto-open staff dashboard in browser after 2 seconds
            def open_browser():
                time.sleep(2)
                try:
                    webbrowser.open(f'http://localhost:{port}/staff_dashboard.html')
                    print(f"🌐 Opened staff dashboard in browser")
                except Exception as e:
                    print(f"⚠️  Could not auto-open browser: {e}")
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            print("🎯 SERVER READY - Staff Dashboard should open automatically!")
            print("=" * 60)
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} is already in use!")
            print(f"💡 Try a different port or stop the existing server")
            print(f"💡 Alternative: python serve_staff_dashboard.py --port 3006")
        else:
            print(f"❌ Server error: {e}")
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def main():
    import sys
    
    # Default port
    port = 3005
    
    # Check for custom port argument
    if len(sys.argv) > 1:
        if sys.argv[1] == '--port' and len(sys.argv) > 2:
            try:
                port = int(sys.argv[2])
            except ValueError:
                print("❌ Invalid port number")
                return
        elif sys.argv[1] in ['-h', '--help']:
            print("📖 STAFF DASHBOARD SERVER HELP")
            print("=" * 40)
            print("Usage:")
            print("  python serve_staff_dashboard.py")
            print("  python serve_staff_dashboard.py --port 3006")
            print()
            print("This server fixes 404 errors by properly serving the staff_dashboard.html file")
            print("Make sure backend is running on http://localhost:5000")
            return
    
    print("🎯 STAFF DASHBOARD SERVER")
    print("=" * 40)
    print("This will fix the 404 error by serving staff_dashboard.html properly")
    print()
    
    # Check if backend is running
    try:
        import requests
        response = requests.get("http://localhost:5000/health", timeout=2)
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
        else:
            print("⚠️  Backend responded but may have issues")
    except:
        print("❌ Backend not running! Please start it first:")
        print("   python backend/app.py")
        print()
        print("Continuing anyway... you can start backend later")
    
    print()
    start_server(port)

if __name__ == '__main__':
    main()
