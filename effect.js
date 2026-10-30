/* ==========================================================================
   Happy Birthday Nikita - Interactive Celebration Engine
   Featuring Web Audio API, Canvas Confetti Physics, Touch/Drag Support,
   Interactive Bulbs, Balloons, Cake, Candles, Polaroid & Sister Gifts
   ========================================================================== */

(function ($) {
	'use strict';

	// ==========================================
	// 1. Web Audio API Sound Synthesis Engine
	// ==========================================
	var audioCtx = null;
	var sfxEnabled = true;

	function getAudioContext() {
		if (!audioCtx) {
			var AudioContext = window.AudioContext || window.webkitAudioContext;
			if (AudioContext) {
				audioCtx = new AudioContext();
			}
		}
		if (audioCtx && audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
		return audioCtx;
	}

	function playTone(freq, type, duration, gainVal) {
		if (!sfxEnabled) return;
		var ctx = getAudioContext();
		if (!ctx) return;
		try {
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = type || 'sine';
			osc.frequency.setValueAtTime(freq, ctx.currentTime);

			gain.gain.setValueAtTime(gainVal || 0.25, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start();
			osc.stop(ctx.currentTime + duration);
		} catch (e) {
			console.log('Audio tone error', e);
		}
	}

	// Chime for light bulbs
	function playChime(freq) {
		if (!sfxEnabled) return;
		var ctx = getAudioContext();
		if (!ctx) return;
		try {
			// Fundamental + harmonic for sparkling celestial chime
			playTone(freq, 'sine', 0.8, 0.2);
			playTone(freq * 2, 'triangle', 0.6, 0.1);
		} catch (e) {}
	}

	// Balloon Pop Sound
	function playPopSound() {
		if (!sfxEnabled) return;
		var ctx = getAudioContext();
		if (!ctx) return;
		try {
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(350, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);

			gain.gain.setValueAtTime(0.6, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start();
			osc.stop(ctx.currentTime + 0.12);
		} catch (e) {}
	}

	// Candle Blow Sound (Gentle noise / breath)
	function playBlowSound() {
		if (!sfxEnabled) return;
		var ctx = getAudioContext();
		if (!ctx) return;
		try {
			var bufferSize = ctx.sampleRate * 0.4;
			var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			var data = buffer.getChannelData(0);
			for (var i = 0; i < bufferSize; i++) {
				data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
			}
			var noise = ctx.createBufferSource();
			noise.buffer = buffer;
			var filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(800, ctx.currentTime);

			var gain = ctx.createGain();
			gain.gain.setValueAtTime(0.4, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

			noise.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			noise.start();
		} catch (e) {}
	}

	// Fanfare Cheer
	function playCheerSound() {
		if (!sfxEnabled) return;
		var notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C chord
		notes.forEach(function (freq, index) {
			setTimeout(function () {
				playTone(freq, 'sine', 0.9, 0.2);
			}, index * 90);
		});
	}

	// ==========================================
	// 2. Confetti & Particle Physics Canvas Engine
	// ==========================================
	var canvas = document.getElementById('confetti-canvas');
	var ctx = canvas ? canvas.getContext('2d') : null;
	var particles = [];
	var confettiColors = ['#ff6b8b', '#ffd166', '#4d96ff', '#6bcb77', '#ff9f43', '#845ec2', '#ffffff', '#ff9ff3'];

	function resizeCanvas() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
	window.addEventListener('resize', resizeCanvas);
	resizeCanvas();

	function createConfettiBurst(x, y, count, spread) {
		if (!ctx) return;
		count = count || 40;
		spread = spread || 6;
		for (var i = 0; i < count; i++) {
			var angle = Math.random() * Math.PI * 2;
			var speed = Math.random() * spread + 2;
			var type = Math.random() > 0.4 ? 'rect' : (Math.random() > 0.5 ? 'heart' : 'circle');
			particles.push({
				x: x,
				y: y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - (Math.random() * 4 + 2),
				size: Math.random() * 8 + 6,
				color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
				rotation: Math.random() * 360,
				rSpeed: (Math.random() * 10 - 5),
				type: type,
				gravity: 0.14,
				alpha: 1,
				decay: Math.random() * 0.008 + 0.005
			});
		}
	}

	function createFloatingHeartShower(x, y, count) {
		count = count || 25;
		for (var i = 0; i < count; i++) {
			particles.push({
				x: (x || Math.random() * window.innerWidth),
				y: (y || window.innerHeight + 10),
				vx: (Math.random() - 0.5) * 3,
				vy: -(Math.random() * 4 + 3),
				size: Math.random() * 14 + 10,
				color: '#ff4d6d',
				rotation: Math.random() * 30 - 15,
				rSpeed: Math.random() * 2 - 1,
				type: 'heart',
				gravity: -0.02,
				alpha: 1,
				decay: 0.007
			});
		}
	}

	function renderParticles() {
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (var i = particles.length - 1; i >= 0; i--) {
			var p = particles[i];
			p.x += p.vx;
			p.y += p.vy;
			p.vy += p.gravity;
			p.rotation += p.rSpeed;
			p.alpha -= p.decay;

			if (p.alpha <= 0 || p.y > canvas.height + 50) {
				particles.splice(i, 1);
				continue;
			}

			ctx.save();
			ctx.globalAlpha = Math.max(0, p.alpha);
			ctx.translate(p.x, p.y);
			ctx.rotate((p.rotation * Math.PI) / 180);
			ctx.fillStyle = p.color;

			if (p.type === 'rect') {
				ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
			} else if (p.type === 'circle') {
				ctx.beginPath();
				ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
				ctx.fill();
			} else if (p.type === 'heart') {
				var s = p.size / 15;
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.bezierCurveTo(-5 * s, -10 * s, -15 * s, -3 * s, 0, 10 * s);
				ctx.bezierCurveTo(15 * s, -3 * s, 5 * s, -10 * s, 0, 0);
				ctx.fill();
			}
			ctx.restore();
		}

		requestAnimationFrame(renderParticles);
	}
	renderParticles();

	// Global Screen-Tap Particle Blast (Interactivity everywhere!)
	$(document).on('click', function (e) {
		// Ignore if clicking on control buttons or audio widgets to avoid obstruction
		if ($(e.target).closest('.navbar-fixed-bottom, .top-header-bar, .modal').length === 0) {
			createConfettiBurst(e.clientX, e.clientY, 18, 5);
		}
	});

	// ==========================================
	// 3. Document Ready Initialization
	// ==========================================
	var loadingHidden = false;
	function hideLoading() {
		if (loadingHidden) return;
		loadingHidden = true;
		$('.loading').fadeOut('fast');
		$('.container').fadeIn('slow');
		showHint('💡 Tap "Turn On Lights" or tap any bulb to play music chimes!');
	}

	$(window).on('load', hideLoading);
	setTimeout(hideLoading, 1200); // Safety fallback so user is never blocked

	$(document).ready(function () {
		var audio = $('.song')[0];

		function showHint(text) {
			$('#hint_toast').text(text).stop(true, true).fadeIn(300).delay(4500).fadeOut(500);
		}

		// SFX Toggle
		$('#sfx-toggle').on('click', function (e) {
			e.stopPropagation();
			sfxEnabled = !sfxEnabled;
			$('#sfx-icon').text(sfxEnabled ? '🔊' : '🔇');
			$(this).html('<span id="sfx-icon">' + (sfxEnabled ? '🔊' : '🔇') + '</span> SFX: ' + (sfxEnabled ? 'On' : 'Off'));
			showHint('Sound Effects: ' + (sfxEnabled ? 'Enabled' : 'Muted'));
		});

		// Confetti Blast Button
		$('#confetti-btn').on('click', function (e) {
			e.stopPropagation();
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 3, 90, 12);
			createFloatingHeartShower(null, null, 30);
			playCheerSound();
		});

		// Music Toggle Widget
		function toggleMusic() {
			getAudioContext();
			if (audio.paused) {
				audio.play().then(function () {
					$('#music-toggle').addClass('playing');
					$('#music-label').text('⏸️ Pause Music');
				}).catch(function (err) {
					console.log('Audio autoplay prevented:', err);
				});
			} else {
				audio.pause();
				$('#music-toggle').removeClass('playing');
				$('#music-label').text('🎵 Play Music');
			}
		}
		$('#music-toggle').on('click', function (e) {
			e.stopPropagation();
			toggleMusic();
		});

		// ==========================================
		// 4. Interactive Bulbs & Chimes
		// ==========================================
		var bulbGlowClasses = [
			'bulb-glow-yellow bulb-glow-yellow-after',
			'bulb-glow-red bulb-glow-red-after',
			'bulb-glow-blue bulb-glow-blue-after',
			'bulb-glow-green bulb-glow-green-after',
			'bulb-glow-pink bulb-glow-pink-after',
			'bulb-glow-orange bulb-glow-orange-after'
		];

		$('.bulb-holder').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			var note = parseFloat($(this).data('note')) || 523.25;
			playChime(note);

			var $bulb = $(this).find('.bulb');
			$bulb.addClass('bulb-glow-yellow'); // trigger glow
			$(this).css('transform', 'translateY(8px) scale(1.2)');
			setTimeout(function () {
				$('.bulb-holder').css('transform', '');
			}, 300);

			var offset = $(this).offset();
			createConfettiBurst(offset.left + 25, offset.top + 30, 12, 3);
			showHint('🎵 Playing chime: ' + $(this).find('.bulb-hint').text());
		});

		// ==========================================
		// 5. Interactive Banner
		// ==========================================
		var bannerQuotes = [
			'🎂 Happy Birthday Dearest Nikita! 👑✨',
			'👑 Queen of Hearts & World’s Best Sister! 💕',
			'🌟 Forever My Partner in Crime & Laughter! 😂',
			'✨ May All Your Biggest Dreams Come True! 🚀',
			'💖 Pure Sunshine, Kindness & Inspiration! 🌸',
			'🎉 Cheers to Another Year of Beautiful Moments! 🥂'
		];
		var quoteIndex = 0;

		$('#main_banner, #banner-tag').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playCheerSound();

			quoteIndex = (quoteIndex + 1) % bannerQuotes.length;
			$('#banner-tag').text(bannerQuotes[quoteIndex]);

			var offset = $(this).offset();
			createConfettiBurst(offset.left + 30, offset.top + 20, 30, 8);
			createConfettiBurst(offset.left + $(this).width() - 30, offset.top + 20, 30, 8);
			showHint('👑 Banner updated with sister love!');
		});

		// ==========================================
		// 6. Interactive Balloons: Drag, Bounce & Pop
		// ==========================================
		var balloonsArray = ['#b1', '#b2', '#b3', '#b4', '#b5', '#b6', '#b7'];

		// Drag & Toss Support for Balloons
		var activeDragBalloon = null;
		var dragOffsetX = 0;
		var dragOffsetY = 0;
		var isDragging = false;

		$('.balloons').on('mousedown touchstart', function (e) {
			getAudioContext();
			activeDragBalloon = $(this);
			activeDragBalloon.stop(); // pause auto-animation
			isDragging = false;

			var clientX = e.type === 'touchstart' ? e.originalEvent.touches[0].clientX : e.clientX;
			var clientY = e.type === 'touchstart' ? e.originalEvent.touches[0].clientY : e.clientY;

			var pos = activeDragBalloon.position();
			dragOffsetX = clientX - pos.left;
			dragOffsetY = clientY - pos.top;
		});

		$(document).on('mousemove touchmove', function (e) {
			if (!activeDragBalloon) return;
			isDragging = true;
			var clientX = e.type === 'touchmove' ? e.originalEvent.touches[0].clientX : e.clientX;
			var clientY = e.type === 'touchmove' ? e.originalEvent.touches[0].clientY : e.clientY;

			var newLeft = clientX - dragOffsetX;
			var newTop = clientY - dragOffsetY;

			activeDragBalloon.css({
				left: newLeft + 'px',
				top: newTop + 'px',
				bottom: 'auto'
			});
		});

		$(document).on('mouseup touchend', function () {
			if (activeDragBalloon) {
				if (!isDragging) {
					// It was a tap / click: Pop or Bounce!
					handleBalloonInteraction(activeDragBalloon);
				}
				activeDragBalloon = null;
			}
		});

		function handleBalloonInteraction($balloon) {
			var trait = $balloon.data('trait') || 'Happy Birthday!';
			var offset = $balloon.offset();

			playPopSound();
			createConfettiBurst(offset.left + 50, offset.top + 70, 45, 9);
			createFloatingHeartShower(offset.left + 50, offset.top + 70, 15);

			// Pop animation
			$balloon.css('transform', 'scale(1.4)').fadeOut(200, function () {
				showHint('🎈 Nikita is: ' + trait);
				// Respawn after 4 seconds so she can play again!
				setTimeout(function () {
					$balloon.fadeIn(600).css('transform', 'scale(1)');
				}, 4000);
			});
		}

		// ==========================================
		// 7. Interactive Cake, Candles & Toppings
		// ==========================================
		var isCandleLit = false;

		function blowCandle() {
			if (!isCandleLit) return;
			getAudioContext();
			playBlowSound();
			isCandleLit = false;

			$('#candle_flame').fadeOut(300, function () {
				// Spawn smoke puff
				var $smoke = $('<div class="smoke-puff"></div>');
				$('.velas').append($smoke);
				setTimeout(function () {
					$smoke.remove();
				}, 1800);
			});

			playCheerSound();
			createFloatingHeartShower(window.innerWidth / 2, window.innerHeight / 2, 40);
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 80, 10);
			showHint('✨ Make a wish, Nikita! May all your secret prayers come true! 💖');
		}

		function lightCandle() {
			getAudioContext();
			isCandleLit = true;
			$('#candle_flame').fadeIn(400);
			playTone(880, 'sine', 0.3, 0.2);
			showHint('🕯️ The candle is brightly lit with your wishes!');
		}

		// Tap directly on flame or candle stick
		$('#candle_flame, #candle_stick').on('click', function (e) {
			e.stopPropagation();
			if (isCandleLit) {
				blowCandle();
			} else {
				lightCandle();
			}
		});

		$('#btn_blow_candle').on('click', function (e) {
			e.stopPropagation();
			blowCandle();
		});

		// Cut Cake Slice
		$('#btn_cut_cake, .cake').on('click', function (e) {
			// Don't trigger if clicked on the candle directly
			if ($(e.target).closest('#candle_flame, #candle_stick, .topping-item').length > 0) return;
			e.stopPropagation();
			getAudioContext();
			playCheerSound();
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 60, 8);
			$('#slice_modal').fadeIn(350);
		});

		$('#close_slice_btn').on('click', function (e) {
			e.stopPropagation();
			$('#slice_modal').fadeOut(250);
		});

		// Interactive Cake Toppings
		$('[data-topping]').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playTone(700, 'triangle', 0.2, 0.2);
			var emoji = $(this).data('topping');

			var randomX = Math.random() * 180 + 30;
			var randomY = Math.random() * 90 + 30;

			var $item = $('<div class="topping-item">' + emoji + '</div>');
			$item.css({
				left: randomX + 'px',
				top: randomY + 'px'
			});
			$('#cake_toppings').append($item);
			showHint('🍰 Added ' + emoji + ' topping to Nikita\'s cake!');
		});

		// ==========================================
		// 8. Polaroid Photo Card (bd1.jpg)
		// ==========================================
		var polaroidFlipped = false;
		$('#polaroid_card').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playTone(520, 'sine', 0.3, 0.2);
			polaroidFlipped = !polaroidFlipped;

			if (polaroidFlipped) {
				$('#polaroid_front, #polaroid_caption').hide();
				$('#polaroid_back').fadeIn(400);
				$(this).css('transform', 'rotate(0deg) scale(1.08)');
			} else {
				$('#polaroid_back').hide();
				$('#polaroid_front, #polaroid_caption').fadeIn(400);
				$(this).css('transform', 'rotate(-3deg) scale(1)');
			}
		});

		// ==========================================
		// 9. Surprise Gift Box 🎁
		// ==========================================
		var giftOpened = false;
		$('#gift_box').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();

			if (!giftOpened) {
				giftOpened = true;
				playCheerSound();
				$(this).addClass('opened');
				createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 80, 12);
				createFloatingHeartShower(null, null, 30);
				$('#gift_hint').text('🎁 Woohoo! Nikita\'s Sister Privilege Coupons Unlocked! 🎉');
				$('#coupons_grid').css('display', 'grid').hide().fadeIn(600);
			} else {
				createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 40, 6);
			}
		});

		$('.coupon-card').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playTone(800, 'triangle', 0.3, 0.25);
			createConfettiBurst(e.clientX, e.clientY, 35, 6);
			var title = $(this).find('.coupon-title').text();
			showHint('🎟️ Redeemed: "' + title + '"! Promised by your brother! ❤️');
		});

		$('#btn_virtual_hug').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playCheerSound();
			createFloatingHeartShower(null, null, 50);
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 90, 14);
			showHint('🫂 Sending you the biggest, warmest sister hug across the galaxy, Nikita! 💕');
		});

		// ==========================================
		// 11. Sequential Stage Progression
		// ==========================================
		$('#turn_on').click(function () {
			getAudioContext();
			$('#bulb_yellow').addClass('bulb-glow-yellow');
			$('#bulb_red').addClass('bulb-glow-red');
			$('#bulb_blue').addClass('bulb-glow-blue');
			$('#bulb_green').addClass('bulb-glow-green');
			$('#bulb_pink').addClass('bulb-glow-pink');
			$('#bulb_orange').addClass('bulb-glow-orange');
			$('body').addClass('peach');
			playCheerSound();
			showHint('✨ Fairy lights turned on! Now play the birthday tune 🎵');

			$(this).fadeOut('slow').delay(1000).promise().done(function () {
				$('#play').fadeIn('slow');
			});
		});

		$('#play').click(function () {
			getAudioContext();
			audio.play().then(function () {
				$('#music-toggle').addClass('playing');
				$('#music-label').text('⏸️ Pause Music');
			}).catch(function (e) {});

			$('#bulb_yellow').addClass('bulb-glow-yellow-after');
			$('#bulb_red').addClass('bulb-glow-red-after');
			$('#bulb_blue').addClass('bulb-glow-blue-after');
			$('#bulb_green').addClass('bulb-glow-green-after');
			$('#bulb_pink').addClass('bulb-glow-pink-after');
			$('#bulb_orange').addClass('bulb-glow-orange-after');
			$('body').addClass('peach-after');

			createFloatingHeartShower(null, null, 25);
			showHint('🎵 Music playing! Let\'s decorate the room for Nikita! 🎀');

			$(this).fadeOut('slow').delay(1000).promise().done(function () {
				$('#bannar_coming').fadeIn('slow');
			});
		});

		$('#bannar_coming').click(function () {
			getAudioContext();
			playCheerSound();
			$('.bannar').addClass('bannar-come');
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 3, 70, 10);
			showHint('🎀 Birthday banner dropped! Now release the floating balloons! 🎈');

			$(this).fadeOut('slow').delay(1000).promise().done(function () {
				$('#balloons_flying').fadeIn('slow');
			});
		});

		function loopBalloon(id, delay) {
			function animate() {
				var randLeft = Math.random() * (window.innerWidth - 120);
				var randBottom = Math.random() * (window.innerHeight - 300) + 80;
				$(id).animate({ left: randLeft, bottom: randBottom }, 7000 + Math.random() * 4000, 'swing', function () {
					animate();
				});
			}
			setTimeout(animate, delay);
		}

		$('#balloons_flying').click(function () {
			getAudioContext();
			playCheerSound();
			$('.balloon-border').animate({ top: -500 }, 7000);
			$('.balloons').css('opacity', '0.9');

			$('#b1,#b4,#b5,#b7').addClass('balloons-rotate-behaviour-one');
			$('#b2,#b3,#b6').addClass('balloons-rotate-behaviour-two');

			balloonsArray.forEach(function (id, idx) {
				$(id).fadeIn('slow');
				loopBalloon(id, idx * 300);
			});

			showHint('🎈 Balloons are floating! Drag them or tap them! Next up: the cake! 🎂');

			$(this).fadeOut('slow').delay(1200).promise().done(function () {
				$('#cake_fadein').fadeIn('slow');
			});
		});

		$('#cake_fadein').click(function () {
			getAudioContext();
			playCheerSound();
			$('.cake').fadeIn('slow');
			$('#cake_controls').css('display', 'flex').hide().fadeIn('slow');
			$('#polaroid_container').fadeIn('slow');
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 50, 8);
			showHint('🎂 Delicious cake is here! Let\'s light the candle! 🕯️');

			$(this).fadeOut('slow').delay(1000).promise().done(function () {
				$('#light_candle').fadeIn('slow');
			});
		});

		$('#light_candle').click(function () {
			getAudioContext();
			lightCandle();
			createFloatingHeartShower(window.innerWidth / 2, window.innerHeight / 2, 25);
			showHint('🕯️ Flame lit! Tap the flame anytime to blow it out! 💖');

			$(this).fadeOut('slow').delay(1000).promise().done(function () {
				$('#wish_message').fadeIn('slow');
			});
		});

		$('#wish_message').click(function () {
			getAudioContext();
			playCheerSound();
			var vw = window.innerWidth / 2;

			// Stop floating and arrange in neat line spelling N-I-K-I-T-A-❤️
			balloonsArray.forEach(function (id) {
				$(id).stop();
			});

			var balloonSpacing = 85;
			if (window.innerWidth < 650) {
				balloonSpacing = Math.max(45, window.innerWidth / 8);
			}

			var startX = vw - (3 * balloonSpacing);

			$('#b1').animate({ top: 220, left: startX + 0 * balloonSpacing }, 600);
			$('#b2').animate({ top: 220, left: startX + 1 * balloonSpacing }, 600);
			$('#b3').animate({ top: 220, left: startX + 2 * balloonSpacing }, 600);
			$('#b4').animate({ top: 220, left: startX + 3 * balloonSpacing }, 600);
			$('#b5').animate({ top: 220, left: startX + 4 * balloonSpacing }, 600);
			$('#b6').animate({ top: 220, left: startX + 5 * balloonSpacing }, 600);
			$('#b7').animate({ top: 220, left: startX + 6 * balloonSpacing }, 600);

			$('.balloons h2').fadeIn(1500);
			createConfettiBurst(vw, 240, 80, 10);
			showHint('💖 Balloons spell: N I K I T A ❤️! Next: Open Nikita\'s Gift Box! 🎁');

			$(this).fadeOut('slow').delay(1200).promise().done(function () {
				$('#open_gift').fadeIn('slow');
			});
		});

		$('#open_gift').click(function () {
			getAudioContext();
			playCheerSound();
			$('#gift_section').fadeIn('slow');
			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 70, 10);
			createFloatingHeartShower(null, null, 30);
			showHint('🎁 Tap the gift box above to unwrap Nikita\'s sister coupons! 🎀');
			$(this).fadeOut('slow');
		});

		// ==========================================
		// 12. Free Play / Show All Mode
		// ==========================================
		$('#free-play-btn').on('click', function (e) {
			e.stopPropagation();
			getAudioContext();
			playCheerSound();

			// Enable background & lights
			$('body').addClass('peach peach-after');
			$('.bulb').addClass('bulb-glow-yellow bulb-glow-yellow-after');

			// Show Banner
			$('.bannar').addClass('bannar-come');

			// Show Balloons
			$('.balloons').css('opacity', '0.9').fadeIn('fast');
			$('.balloons h2').fadeIn('fast');
			$('#b1,#b4,#b5,#b7').addClass('balloons-rotate-behaviour-one');
			$('#b2,#b3,#b6').addClass('balloons-rotate-behaviour-two');
			balloonsArray.forEach(function (id, idx) {
				loopBalloon(id, idx * 250);
			});

			// Show Cake & Light Candle
			$('.cake').fadeIn('fast');
			$('#cake_controls').css('display', 'flex');
			lightCandle();

			// Show Polaroid, Gift
			$('#polaroid_container').fadeIn('fast');
			$('#gift_section').fadeIn('fast');

			// Hide bottom progression steps
			$('.navbar-fixed-bottom button').hide();

			createConfettiBurst(window.innerWidth / 2, window.innerHeight / 3, 90, 12);
			createFloatingHeartShower(null, null, 40);
			showHint('✨ All interactive elements unlocked! Enjoy exploring, Nikita! 💖');
		});

	});

})(jQuery);
