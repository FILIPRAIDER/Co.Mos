"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Send, Home } from "lucide-react";

function ResenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cleanupSession = () => {
    // Limpiar localStorage
    localStorage.removeItem('sessionCode');
    localStorage.removeItem('tableId');
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('restaurantId');
    localStorage.removeItem('restaurantName');
    localStorage.removeItem('restaurantSlug');
    localStorage.removeItem('cart');
    localStorage.removeItem('scannedAt');
  };

  const liftTable = async () => {
    const sessionCode = localStorage.getItem('sessionCode');
    const tableId = localStorage.getItem('tableId');

    if (tableId && sessionCode) {
      try {
        await fetch(`/api/tables/${tableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'lift',
            sessionCode,
          }),
        });
      } catch (error) {
        console.error('Error al levantar mesa:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Enviar reseña
      const reviewResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!reviewResponse.ok) {
        throw new Error('Error al enviar la reseña');
      }

      // 2. Levantar mesa
      await liftTable();

      // 3. Limpiar sesión
      cleanupSession();

      setSubmitted(true);
      
      // Redirigir al inicio después de 2 segundos
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al enviar tu reseña. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Levantar mesa y limpiar sesión aunque no deje reseña
    await liftTable();
    cleanupSession();
    router.push('/');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 mb-6 animate-pulse">
            <span className="text-5xl">🙏</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-3">¡Gracias por tu Reseña!</h1>
          <p className="text-white/60 mb-6">
            Tu opinión nos ayuda a mejorar cada día
          </p>

          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <p className="text-sm text-green-300">
              ¡Hasta pronto! 👋
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-md mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/20 mb-4">
            <span className="text-4xl">⭐</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">¿Cómo estuvo tu experiencia?</h1>
          <p className="text-sm text-white/60">
            Orden #{orderId?.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Rating Stars */}
        <div className="bg-[#1a1a1f] rounded-2xl p-8 mb-6">
          <p className="text-center text-sm text-white/60 mb-4">
            Califica tu experiencia
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`h-12 w-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-orange-500 text-orange-500'
                      : 'text-white/20'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Label */}
          {rating > 0 && (
            <p className="text-center font-medium text-orange-500 animate-fade-in">
              {rating === 1 && '😞 Muy Insatisfecho'}
              {rating === 2 && '😕 Insatisfecho'}
              {rating === 3 && '😐 Regular'}
              {rating === 4 && '😊 Satisfecho'}
              {rating === 5 && '🤩 ¡Excelente!'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="bg-[#1a1a1f] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium mb-3">
            Cuéntanos más (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué podemos mejorar? ¿Qué te gustó?"
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Reseña
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-3 font-medium transition hover:bg-white/5"
          >
            <Home className="h-4 w-4" />
            Omitir y Salir
          </button>
        </div>

        {/* Incentive Message */}
        <div className="mt-6 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-4 text-center">
          <p className="text-sm text-white/80">
            ✨ Tu opinión nos ayuda a ofrecerte un mejor servicio
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResenaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    }>
      <ResenaContent />
    </Suspense>
  );
}
