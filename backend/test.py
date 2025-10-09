#!/usr/bin/env python3
import http.server
import socketserver
import json

class MyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = json.dumps({"message": "Python server working!"})
        self.wfile.write(response.encode())

PORT = 3007
print(f"Starting Python server on port {PORT}")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Python server running on port {PORT}")
    httpd.serve_forever()