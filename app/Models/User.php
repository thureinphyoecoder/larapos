<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * @method bool hasAnyRole(array|string $roles, string|null $guard = null)
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'shop_id',
    ];

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function attendances()
    {
        return $this->hasMany(StaffAttendance::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new class extends VerifyEmail {
            public function toMail($notifiable)
            {
                $verificationUrl = $this->verificationUrl($notifiable);

                return (new MailMessage)
                    ->subject('အီးမေးလ် အတည်ပြုရန် - LaraPee POS') // Email Title
                    ->greeting('မင်္ဂလာပါ ' . $notifiable->name . ' ခင်ဗျာ...')
                    ->line('LaraPee POS ကို အသုံးပြုနိုင်ဖို့ အောက်ကခလုတ်ကို နှိပ်ပြီး အတည်ပြုပေးပါ။')
                    ->action('အီးမေးလ် အတည်ပြုမည်', $verificationUrl) // ခလုတ်ပေါ်ကစာ
                    ->line('ဒီအကောင့်ကို သင်ကိုယ်တိုင် မဖွင့်ခဲ့ဘူးဆိုရင် ဘာမှလုပ်စရာမလိုပါဘူး။')
                    ->salutation('လေးစားစွာဖြင့်၊ LaraPee အဖွဲ့သားများ');
            }
        });
    }
}
