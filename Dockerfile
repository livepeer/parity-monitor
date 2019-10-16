FROM node:10
WORKDIR /app
ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install
ADD parity-monitor.js parity-monitor.js
RUN mkfifo /root/log
CMD ["tail", "-f", "/root/log"]