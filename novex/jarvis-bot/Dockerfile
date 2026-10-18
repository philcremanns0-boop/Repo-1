FROM python:3.12-slim
WORKDIR /app
COPY bot.py /app/bot.py
ENV BOT_DB=/data/jarvis.db PYTHONUNBUFFERED=1
VOLUME /data
CMD ["python", "bot.py"]
