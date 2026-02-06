# analytics/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# RabbitMQ နဲ့ ချိတ်ဖို့ library သွင်းမယ်
RUN pip install pika pandas

# monitor.py ကို run ထားမယ်
CMD ["python", "monitor.py"]