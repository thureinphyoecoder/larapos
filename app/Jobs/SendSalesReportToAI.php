<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class SendSalesReportToAI implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $connection = new AMQPStreamConnection('rabbitmq', 5672, 'guest', 'guest');
        $channel = $connection->channel();

        $channel->queue_declare('sales_queue', false, false, false, false);

        $data = json_encode([
            'product_name' => "Coke Can",
            'qty' => 1,
            'price' => 20,
            'sold_at' => now()->toDateTimeString()
        ]);

        $msg = new AMQPMessage($data);
        $channel->basic_publish($msg, '', 'sales_queue');

        $channel->close();
        $connection->close();
    }
}
