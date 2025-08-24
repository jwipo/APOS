   function lerp(start, end, amt) {
        return start + (end - start) * amt;
      }
      // ✅ 추가: 부드러운 감쇠 보간 함수
      function smoothLerp(start, end, amt) {
        return start + (end - start) * (1 - Math.exp(-amt));
      }
      function adaptiveLerp(current, target) {
        const diff = Math.abs(current - target);
        const damping = diff > 100 ? 0.008 : diff > 50 ? 0.015 : 0.025;
        return current + (target - current) * (1 - Math.exp(-damping));
      }

      const mapMatrix = {
        "0,0": true,
        "1,0": true,
        "0,-1": false, // 이 위치는 벽
        "0,1": true,
        "-1,0": false,
      };
      let playerPosition = { x: 0, y: 0 }; // 시작 위치 (ex: 0,0)
      const dirOffset = {
        front: { dx: 1, dy: 0 },
        right: { dx: 0, dy: 1 },
        back: { dx: -1, dy: 0 },
        left: { dx: 0, dy: -1 },
      };

      const views = ["front", "right", "back", "left"];
      let currentViewIndex = 0;
      const themeImages = {
        front: {
          dawn: "front-dawn.png",
          day: "../이미지/test-a.png",
          evening: "front-evening.png",
        },
        left: {
          dawn: "left-dawn.png",
          day: "../이미지/test-b.png",
          evening: "left-evening.png",
        },
        right: {
          dawn: "right-dawn.png",
          day: "../이미지/test-c.png",
          evening: "right-evening.png",
        },
        back: {
          dawn: "back-dawn.png",
          day: "../이미지/test1.png",
          evening: "back-evening.png",
        },
      };
      const cursors = {
        left: "../이미지/cursor-left.png",
        front: "../이미지/cursor-front.png",
        right: "../이미지/cursor-right.png",
        back: "../이미지/cursor-back.png",
      };

      let currentTheme = getKSTTheme();

      function getKSTTheme() {
        const kstHour = (new Date().getUTCHours() + 9) % 24;
        if (kstHour <= 5) return "dawn";
        if (kstHour <= 17) return "day";
        return "evening";
      }

      function setWeatherIcon(theme) {
        const iconWrap = document.getElementById("weatherIcon");
        iconWrap.innerHTML = "";

        const svgBase = (innerContent, bg, opacity) => `
    <svg viewBox="0 0 64 64" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="circleMask">
          <circle cx="32" cy="32" r="28" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="28" fill="${bg}" opacity="${opacity}" />
      <g clip-path="url(#circleMask)">
        ${innerContent}
      </g>
    </svg>
  `;

        let content = "";
        let bgColor = "#000"; // 기본 어두운 배경
        let opacity = 0.85;

        if (theme === "day") {
          bgColor = "#FFEAAA";
          opacity = 0.4;
          content = `
      <circle cx="32" cy="32" r="14" fill="#FFD93B" stroke="#FFB700" stroke-width="2"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315]
        .map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 32 + Math.cos(rad) * 20;
          const y1 = 32 + Math.sin(rad) * 20;
          const x2 = 32 + Math.cos(rad) * 28;
          const y2 = 32 + Math.sin(rad) * 28;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFD93B" stroke-width="2.2" stroke-linecap="round"/>`;
        })
        .join("")}
    `;
        } else if (theme === "dawn") {
          bgColor = "#1B1D2B";
          opacity = 0.5;
          content = `
      <path d="M24 22 A14 14 0 1 0 44 32 A8 11 0 1 1 24 22"
            fill="#FFCE54" stroke="#B17F00" stroke-width="2.2"/>
      <path d="M20 38 Q24 30 30 32 Q32 28 40 32 Q46 33 48 38 H22 Q20 39 20 38"
            fill="#7B8EC6" stroke="#445E99" stroke-width="2" opacity="0.85"/>
    `;
        } else if (theme === "evening") {
          bgColor = "#3B1C20"; // 붉은 저녁 하늘 느낌
          opacity = 0.6;
          content = `
      <!-- 주황빛 보름달 -->
      <circle cx="32" cy="32" r="14" fill="#FFBB66" stroke="#D4882F" stroke-width="2"/>
      
      <!-- 붉은 섀도우 -->
      <circle cx="38" cy="26" r="2" fill="#CC6644" opacity="0.5" />
      <circle cx="26" cy="38" r="1.5" fill="#AA5533" opacity="0.6" />
      <circle cx="40" cy="42" r="1.5" fill="#C76630" opacity="0.7" />

      <!-- 붉은 별 느낌 -->
      ${[
        [18, 14],
        [45, 20],
        [38, 10],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="1.2" fill="#FFA07A" opacity="0.8"/>`
        )
        .join("")}
    `;
        } else {
          bgColor = "#444";
          opacity = 0.6;
          content = `<text x="32" y="38" text-anchor="middle" font-size="12" fill="#aaa">??</text>`;
        }

        iconWrap.innerHTML = svgBase(content, bgColor, opacity);
      }

      function updateBackground() {
        const img = themeImages[views[currentViewIndex]][currentTheme];
        document.body.style.backgroundImage = `url('${img}')`;
        setWeatherIcon(currentTheme);
      }

      function setTheme(theme) {
        currentTheme = theme;
        updateBackground();
      }
      function setViewByOffset(offset) {
        currentViewIndex =
          (currentViewIndex + offset + views.length) % views.length;
        updateBackground();
      }
      function goForward() {
        const dir = views[currentViewIndex];
        const { dx, dy } = dirOffset[dir];
        const nextX = playerPosition.x + dx;
        const nextY = playerPosition.y + dy;
        const key = `${nextX},${nextY}`;

        if (mapMatrix[key]) {
          playerPosition = { x: nextX, y: nextY };
          location.href = `${nextX}-${nextY}.html`;
        } else {
          alert("🚫 이동할 수 없습니다.");
        }
      }

      function goBackSite() {
        currentViewIndex = (currentViewIndex + 2) % views.length;
        updateBackground();
      }

      const cursorA = document.getElementById("cursorA");
      const cursorB = document.getElementById("cursorB");
      let nowCursor = "front",
        usingA = true;

      document.addEventListener("mousemove", (e) => {
        const x = e.clientX - 40 + "px",
          y = e.clientY - 40 + "px";
        cursorA.style.left = cursorB.style.left = x;
        cursorA.style.top = cursorB.style.top = y;
      });

      function setCursor(dir) {
        if (nowCursor === dir) return;
        const fadeOut = usingA ? cursorA : cursorB;
        const fadeIn = usingA ? cursorB : cursorA;
        fadeIn.style.background = `url('${cursors[dir]}') center/cover no-repeat`;
        fadeIn.classList.add("active");
        fadeIn.classList.remove("fadeout");
        fadeOut.classList.remove("active");
        fadeOut.classList.add("fadeout");
        nowCursor = dir;
        usingA = !usingA;
      }

      function resetCursor() {
        setCursor("front");
      }

      cursorA.style.background = `url('${cursors.front}') center/cover no-repeat`;
      cursorA.classList.add("active");
      cursorB.classList.add("fadeout");
      updateBackground();

      const weekKor = ["일", "월", "화", "수", "목", "금", "토"];
      const tickGroup = document.getElementById("ticks");
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * 2 * Math.PI;
        const r1 = i % 5 === 0 ? 67 : 72;
        const r2 = 78;
        const x1 = 85 + Math.sin(angle) * r1;
        const y1 = 85 - Math.cos(angle) * r1;
        const x2 = 85 + Math.sin(angle) * r2;
        const y2 = 85 - Math.cos(angle) * r2;
        const tick = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        tick.setAttribute("x1", x1);
        tick.setAttribute("y1", y1);
        tick.setAttribute("x2", x2);
        tick.setAttribute("y2", y2);
        tick.setAttribute("stroke", "#fff");
        tick.setAttribute("stroke-width", i % 5 === 0 ? "1.5" : "0.7");
        tick.setAttribute("opacity", i % 5 === 0 ? "0.9" : "0.4");
        tickGroup.appendChild(tick);
      }

      function updateClock() {
        const kst = new Date(); // 시스템 로컬 시간 그대로 사용

        const h = kst.getHours(),
          m = kst.getMinutes();
        document
          .getElementById("hourHand")
          .setAttribute(
            "transform",
            `rotate(${((h % 12) + m / 60) * 30} 85 85)`
          );
        document
          .getElementById("minuteHand")
          .setAttribute("transform", `rotate(${m * 6} 85 85)`);
        document.getElementById("clockDate").textContent = `${kst.getDate()}(${
          weekKor[kst.getDay()]
        })`;
      }
      setInterval(updateClock, 1000);
      updateClock();

      const canvas = document.getElementById("waveCanvas");
      const ctx = canvas.getContext("2d");
      let color = [255, 255, 255],
        amp = 6,
        noise = 2.5,
        speed = 1.8;
      let scrollOffset = 0,
        breath = 0;

      function getStatusParams(hp) {
        if (hp === 100) {
          return {
            color: [180, 255, 200], // 평화로운 상태 (연녹색)
            amp: 3,
            noise: 1.0,
            speed: 0.8,
          };
        }
        if (hp >= 56) {
          return {
            color: [255, 255, 255], // 정상 상태
            amp: 6,
            noise: 2.5,
            speed: 1,
          };
        }
        if (hp >= 21) {
          return {
            color: [255, 170, 43], // 위험 상태 (주황)
            amp: 12,
            noise: 4.5,
            speed: 2,
          };
        }
        return {
          color: [255, 37, 59], // 고위험 상태 (빨간)
          amp: 18,
          noise: 6.0,
          speed: 3,
        };
      }

      function draw(timestamp) {
        const params = getStatusParams(currentHP);
        color[0] = adaptiveLerp(color[0], params.color[0]);
        color[1] = adaptiveLerp(color[1], params.color[1]);
        color[2] = adaptiveLerp(color[2], params.color[2]);

        amp = lerp(amp, params.amp, 0.12);
        noise = lerp(noise, params.noise, 0.09);
        speed = lerp(speed, params.speed, 0.06);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const offsetY = canvas.height / 2;
        const N = 240;
       scrollOffset += Math.min(speed, 100) * 0.0025; // 100 초과는 무시
        breath += 0.03;
        for (let i = 0; i < N; i++) {
          const xRatio = i / (N - 1);
          const x = Math.floor(xRatio * canvas.width);
          const fade = Math.pow(Math.sin(Math.PI * xRatio), 1.2);

          const waveBase = (xRatio + scrollOffset) * 10 + timestamp * 0.00002;

          const wave = Math.sin(waveBase);
          const breathAmp = 1 + Math.sin(breath) * 0.1;
          const glitch = (Math.random() - 0.5) * 0.4;
          const y = Math.round(
            offsetY + (wave * amp + glitch * noise) * fade * breathAmp
          );
          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${
            color[2]
          }, ${fade.toFixed(2)})`;
          ctx.fillRect(x, y, 3, 2);
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
      let currentHP = 100;

      function setHealth(percent) {
        const bar = document.getElementById("healthBar");
        if (bar) {
          bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
        }
      }

      function changeHealth(amount) {
        currentHP = Math.max(0, Math.min(100, currentHP + amount));
        setHealth(currentHP);
      }

      document.addEventListener("DOMContentLoaded", () => {
        setHealth(currentHP);
      });