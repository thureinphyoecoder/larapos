<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class PublicController extends Controller
{
    public function index()
    {
        return inertia('Welcome', [
            'products' => Product::with(['variants', 'brand', 'shop'])->latest()->get()
        ]);
    }
}
