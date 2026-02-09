<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentSequence extends Model
{
    protected $fillable = [
        'document_type',
        'branch_code',
        'sequence_date',
        'last_number',
    ];

    protected function casts(): array
    {
        return [
            'sequence_date' => 'date',
            'last_number' => 'integer',
        ];
    }
}
