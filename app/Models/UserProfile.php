<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'phone_number',
        'address_line_1',
        'city',
        'state',
        'postal_code',
    ];
}
