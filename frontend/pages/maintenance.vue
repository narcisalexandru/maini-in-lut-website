<template>
  <div
    class="relative flex flex-col text-center justify-center items-center min-h-screen bg-gray-100 overflow-hidden"
  >
    <!-- Artificii -->
    <canvas id="fireworks" class="absolute inset-0 z-0"></canvas>

    <!-- Conținut principal -->
    <div class="z-10 px-4">
      <h1 class="text-3xl md:text-5xl font-bold mb-4 text-gray-800">
        Mulțumim pentru încredere!
      </h1>
      <p class="text-lg md:text-xl text-gray-700 mb-6">
        Deschidem în curând. Revenim cu vești bune!
      </p>
      <div class="flex justify-center gap-4">
        <button
          @click="openWhatsApp"
          aria-label="WhatsApp"
          class="social-btn whatsapp"
        >
          <img
            src="/images/socials/whatsapp_logo.png"
            alt="WhatsApp"
            class="w-12 h-12 object-contain cursor-pointer"
          />
        </button>
        <button
          @click="openInstagram"
          aria-label="Instagram"
          class="social-btn instagram"
        >
          <img
            src="/images/socials/instagram_logo.png"
            alt="Instagram"
            class="w-10 h-10 object-contain cursor-pointer"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "empty" });

// Fireworks logic (canvas)
onMounted(() => {
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];

  function createParticle() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.5;
    const radius = Math.random() * 2 + 1;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    const velocityX = (Math.random() - 0.5) * 5;
    const velocityY = (Math.random() - 0.5) * 5;

    particles.push({ x, y, radius, color, velocityX, velocityY, life: 100 });
  }

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      p.x += p.velocityX;
      p.y += p.velocityY;
      p.life--;

      if (p.life <= 0) particles.splice(i, 1);
    });
  }

  function animate() {
    createParticle();
    updateParticles();
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
});

function openWhatsApp() {
  window.open("https://wa.me/40712345678", "_blank"); // Inlocuieste cu numarul tau real
}
function openInstagram() {
  window.open("https://instagram.com/maini.in.lut", "_blank"); // Inlocuieste cu profilul tau real
}
</script>

<style scoped>
canvas {
  pointer-events: none;
}
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  width: 56px;
  height: 56px;
  background: white;
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.06);
  will-change: transform, box-shadow, border;
}
.social-btn.whatsapp:hover,
.social-btn.whatsapp:focus {
  border-color: #25d366;
  box-shadow: 0 4px 16px 0 #25d36622;
  transform: scale(1.08);
}
.social-btn.instagram:hover,
.social-btn.instagram:focus {
  border-color: #e1306c;
  box-shadow: 0 4px 16px 0 #e1306c22;
  transform: scale(1.08);
}
</style>
