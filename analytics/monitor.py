import pika
import time
import json
import sys


def connect_rabbitmq():
    print(" [*] Connecting to RabbitMQ...", flush=True)
    # RabbitMQ စတက်ချင်းမှာ ခဏစောင့်ဖို့
    time.sleep(10)
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq"))
        return connection
    except Exception as e:
        print(f" [!] Connection failed: {e}. Retrying in 5s...", flush=True)
        time.sleep(5)
        return connect_rabbitmq()


def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        # flush=True ထည့်မှ Docker logs မှာ ချက်ချင်းပေါ်မှာပါ
        print(
            f" [AI Analytics] Received: {data['product_name']} | Qty: {data['qty']}",
            flush=True,
        )
    except Exception as e:
        print(f" [!] Error processing message: {e}", flush=True)


connection = connect_rabbitmq()
channel = connection.channel()

# Laravel ဘက်က durable ဖြစ်ဖြစ် မဖြစ်ဖြစ် အလုပ်လုပ်အောင် queue_declare ကို ညှိထားမယ်
channel.queue_declare(queue="sales_queue", durable=False)

channel.basic_consume(queue="sales_queue", on_message_callback=callback, auto_ack=True)

print(" [*] AI Engine is waiting for sales data. To exit press CTRL+C", flush=True)
channel.start_consuming()
