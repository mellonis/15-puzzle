server {
	listen 443 ssl;
	listen [::]:443 ssl;
	http2 on;

	ssl_certificate /etc/letsencrypt/live/15-puzzle.mellonis.ru/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/15-puzzle.mellonis.ru/privkey.pem;

	server_name 15-puzzle.mellonis.ru;

	root /var/web-apps/15-puzzle.mellonis.ru;
	index index.html;

	# Server endpoints proxied to the genuine container (run.sh maps it
	# to 127.0.0.1:20005). Add new endpoint paths here as they appear.
	location ~ ^/(seed|sign)$ {
		proxy_pass http://127.0.0.1:20005;
		proxy_set_header Host              $host;
		proxy_set_header X-Real-IP         $remote_addr;
		proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto https;
	}

	# Hashed assets and chain blobs — names change every build, contents
	# are stable for the life of that build. Far-future cache.
	location /assets/ {
		expires 1y;
		add_header Cache-Control "public, immutable";
		try_files $uri =404;
	}

	location /levels/ {
		expires 1y;
		add_header Cache-Control "public, immutable";
		try_files $uri =404;
	}

	# index.html references hashed asset URLs; always revalidate so a
	# fresh deploy is picked up immediately.
	location = / {
		add_header Cache-Control "no-cache";
		try_files /index.html =404;
	}

	location = /index.html {
		add_header Cache-Control "no-cache";
	}

	location / {
		try_files $uri $uri/ =404;
	}
}
