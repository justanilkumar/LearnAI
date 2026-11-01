// Learnify LMS - Main Application Controller
const state = {
  currentUser: null,
  activeTab: 'courses',
  courses: [],
  categories: [],
  currentCourse: null,
  currentLesson: null,
  currentQuiz: null,
  quizAnswers: {},
  filter: {
    category: 'All',
    level: 'All',
    search: '',
    sort: 'newest'
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await initDemoAuth();
  setupEventListeners();
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
});

// Setup Demo Authentication & Session
async function initDemoAuth() {
  try {
    const demoUsersRes = await api.getDemoUsers();
    const demoSelect = document.getElementById('demoUserSelect');
    if (demoSelect && demoUsersRes.users) {
      demoSelect.innerHTML = demoUsersRes.users
        .map(
          (u) =>
            `<option value="${u.email}" data-role="${u.role}">
              ${u.name} (${u.role.toUpperCase()})
            </option>`
        )
        .join('');

      demoSelect.addEventListener('change', async (e) => {
        await switchUser(e.target.value);
      });
    }

    // Check existing stored session or default to student Alex Morgan
    if (api.token) {
      try {
        const meRes = await api.getMe();
        state.currentUser = meRes.user;
        updateUserUI();
      } catch (err) {
        // Stored token was invalid or expired
        api.logout();
        await switchUser('alex.morgan@student.io');
      }
    } else {
      await switchUser('alex.morgan@student.io');
    }
  } catch (err) {
    console.warn('Auto auth error:', err);
  }
}

async function switchUser(email) {
  try {
    const res = await api.login(email, 'Password123!');
    state.currentUser = res.user;
    updateUserUI();
    renderCurrentTab();
  } catch (err) {
    console.warn('Switch user warning:', err.message);
  }
}

function updateUserUI() {
  const user = state.currentUser;
  const userPillContainer = document.getElementById('userPillContainer');
  const authButtonsGroup = document.getElementById('authButtonsGroup');
  const demoSwitcherWrapper = document.getElementById('demoSwitcherWrapper');
  const instructorNav = document.getElementById('nav-instructor');

  if (user) {
    if (userPillContainer) userPillContainer.style.display = 'flex';
    if (authButtonsGroup) authButtonsGroup.style.display = 'none';

    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    const role = document.getElementById('userRole');
    const demoSelect = document.getElementById('demoUserSelect');

    if (avatar) avatar.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    if (name) name.textContent = user.name;
    if (role) role.textContent = (user.role || 'student').toUpperCase();
    if (demoSelect) demoSelect.value = user.email;

    if (instructorNav) {
      instructorNav.style.display = 'block';
    }
  } else {
    if (userPillContainer) userPillContainer.style.display = 'none';
    if (authButtonsGroup) authButtonsGroup.style.display = 'flex';

    if (instructorNav) {
      instructorNav.style.display = 'none';
    }
  }
}

// Router
function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'courses';
  state.activeTab = hash;

  // Update nav item active states
  document.querySelectorAll('.nav-item').forEach((item) => {
    if (item.dataset.tab === hash) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  renderCurrentTab();
}

function renderCurrentTab() {
  const content = document.getElementById('appContent');
  if (!content) return;

  const subSec = document.getElementById('subscriptionSection');

  switch (state.activeTab) {
    case 'courses':
      if (subSec) subSec.style.display = 'block';
      renderCoursesView();
      break;
    case 'plans':
      if (subSec) {
        subSec.style.display = 'block';
        renderCoursesView().then(() => {
          setTimeout(() => {
            subSec.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        });
      }
      break;
    case 'student':
      if (subSec) subSec.style.display = 'none';
      renderStudentDashboard();
      break;
    case 'instructor':
      if (subSec) subSec.style.display = 'none';
      renderInstructorAnalytics();
      break;
    case 'verify':
      if (subSec) subSec.style.display = 'none';
      renderVerifyView();
      break;
    case 'api-docs':
      if (subSec) subSec.style.display = 'none';
      renderApiDocsView();
      break;
    default:
      if (subSec) subSec.style.display = 'block';
      renderCoursesView();
  }
}

// Event Listeners
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-item button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.parentElement.dataset.tab;
      window.location.hash = tab;
    });
  });

  // Re-seed Database Button
  const resetBtn = document.getElementById('resetDbBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset database to clean default sample courses, enrollments & quizzes?')) {
        try {
          resetBtn.textContent = '⏳ Seeding...';
          await api.resetDatabase();
          alert('Database seeded successfully with clean demo data!');
          resetBtn.textContent = '🌱 Reset Demo Data';
          await switchUser(state.currentUser ? state.currentUser.email : 'alex.morgan@student.io');
        } catch (err) {
          alert('Reset failed: ' + err.message);
          resetBtn.textContent = '🌱 Reset Demo Data';
        }
      }
    });
  }
}

// ==========================================
// 1. COURSES VIEW
// ==========================================
async function renderCoursesView() {
  const content = document.getElementById('appContent');
  content.innerHTML = `
    <div class="hero-split-container">
      <!-- Left Column: Eyebrow, Punchy Headline, Subtitle, Dual CTAs -->
      <div class="hero-left-col">
        <div class="hero-eyebrow-wrapper">
          <span class="hero-eyebrow-line"></span>
          <span class="hero-eyebrow-text">OPEN-SOURCE &amp; MONGODB-POWERED</span>
          <span class="hero-eyebrow-line"></span>
        </div>

        <h1 class="hero-massive-headline">
          Tech skills that<br />
          <span class="hero-headline-accent">sell themselves.</span>
        </h1>

        <p class="hero-description">
          Master production-grade database systems, cloud architecture, and PyMongo machine learning pipelines. Real-time syllabus tracking, auto-graded quizzes, and cryptographically verifiable credentials — built for ambitious engineers.
        </p>

        <div class="hero-cta-actions">
          <button class="btn btn-hero-primary" onclick="const input = document.getElementById('courseSearchInput'); if (input) { input.focus(); document.querySelector('.filter-bar').scrollIntoView({behavior: 'smooth'}); }">
            Explore Courses <span class="arrow-icon">→</span>
          </button>
          <button class="btn btn-hero-secondary" onclick="scrollToPlans()">
            View Personal Plan
          </button>
        </div>

        <div class="hero-social-proof">
          <div class="hero-proof-item">
            <span class="proof-number">12,000+</span>
            <span class="proof-label">Engineers</span>
          </div>
          <div class="proof-separator">•</div>
          <div class="hero-proof-item">
            <span class="proof-number">98.4%</span>
            <span class="proof-label">Pass Rate</span>
          </div>
          <div class="proof-separator">•</div>
          <div class="hero-proof-item">
            <span class="proof-number">100%</span>
            <span class="proof-label">Verifiable Proof</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Floating Showcase Grid (like Image 2 preview) -->
      <div class="hero-right-col">
        <div class="hero-showcase-backdrop"></div>
        <div class="hero-cards-deck">
          <div class="showcase-card showcase-card-primary glass-card">
            <div class="showcase-card-header">
              <span class="showcase-tag">FEATURED MASTERCLASS</span>
              <span class="showcase-badge-pulse">● LIVE</span>
            </div>
            <div class="showcase-card-body">
              <div class="showcase-icon-badge">⚡</div>
              <h3 class="showcase-title">Advanced MongoDB Aggregation Pipelines</h3>
              <p class="showcase-desc">Multi-stage $lookup, $unwind, $group &amp; PyMongo ML model persistence.</p>
              
              <div class="showcase-stats-row">
                <div class="showcase-stat">
                  <span class="stat-val">12 ms</span>
                  <span class="stat-lbl">Latency</span>
                </div>
                <div class="showcase-stat">
                  <span class="stat-val">92.1%</span>
                  <span class="stat-lbl">ML Score</span>
                </div>
                <div class="showcase-stat">
                  <span class="stat-val">4.9 ★</span>
                  <span class="stat-lbl">Rating</span>
                </div>
              </div>
            </div>
            <div class="showcase-card-footer">
              <div class="showcase-instructor">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Dr. Sarah Chen" class="showcase-avatar" />
                <span>Dr. Sarah Chen</span>
              </div>
              <span class="showcase-price-tag">INCLUDED IN PLAN</span>
            </div>
          </div>

          <!-- Floating Badges / Satellites -->
          <div class="showcase-satellite satellite-top">
            <span class="satellite-icon">🏆</span>
            <div>
              <div class="satellite-title">Verified Credential</div>
              <div class="satellite-sub">SHA-256 On-Chain Proof</div>
            </div>
          </div>

          <div class="showcase-satellite satellite-bottom">
            <span class="satellite-icon">🤖</span>
            <div>
              <div class="satellite-title">Random Forest Regressor</div>
              <div class="satellite-sub">R²: 0.7208 • MAE: 3.27</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="glass filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          id="courseSearchInput" 
          class="search-input" 
          placeholder="Search by title, topics, or keywords..." 
          value="${state.filter.search}"
        />
      </div>

      <div class="filter-group" id="categoryFilterGroup">
        <button class="filter-btn ${state.filter.category === 'All' ? 'active' : ''}" data-cat="All">All Categories</button>
        <button class="filter-btn ${state.filter.category === 'Database & Backend' ? 'active' : ''}" data-cat="Database & Backend">Database & Backend</button>
        <button class="filter-btn ${state.filter.category === 'Web Development' ? 'active' : ''}" data-cat="Web Development">Web Development</button>
        <button class="filter-btn ${state.filter.category === 'System Design' ? 'active' : ''}" data-cat="System Design">System Design</button>
        <button class="filter-btn ${state.filter.category === 'DevOps & Cloud' ? 'active' : ''}" data-cat="DevOps & Cloud">DevOps & Cloud</button>
      </div>

      <select id="sortSelect" class="sort-select">
        <option value="newest" ${state.filter.sort === 'newest' ? 'selected' : ''}>Newest First</option>
        <option value="rating" ${state.filter.sort === 'rating' ? 'selected' : ''}>Highest Rated</option>
        <option value="popular" ${state.filter.sort === 'popular' ? 'selected' : ''}>Most Popular</option>
        <option value="price-low" ${state.filter.sort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
      </select>
    </div>

    <div id="coursesGrid" class="courses-grid">
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted)">Loading courses...</p>
      </div>
    </div>
  `;

  // Filter events
  const searchInput = document.getElementById('courseSearchInput');
  searchInput.addEventListener('input', debounce((e) => {
    state.filter.search = e.target.value;
    loadCoursesGrid();
  }, 350));

  document.querySelectorAll('#categoryFilterGroup .filter-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#categoryFilterGroup .filter-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      state.filter.category = e.target.dataset.cat;
      loadCoursesGrid();
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  sortSelect.addEventListener('change', (e) => {
    state.filter.sort = e.target.value;
    loadCoursesGrid();
  });

  await loadCoursesGrid();
}

async function loadCoursesGrid() {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  try {
    const params = {
      category: state.filter.category,
      search: state.filter.search,
      sort: state.filter.sort
    };
    const res = await api.getCourses(params);
    state.courses = res.courses || [];

    if (state.courses.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
          <h3 style="margin-bottom: 0.5rem;">No courses match your query</h3>
          <p style="color: var(--text-muted)">Try adjusting your search terms or category filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.courses
      .map((c) => {
        const isFree = c.price === 0;
        return `
        <div class="glass-card course-card">
          <div class="course-thumb-wrap">
            <img src="${c.thumbnail}" alt="${c.title}" class="course-thumb" loading="lazy" />
            <span class="course-badge-level">${c.level}</span>
            <span class="course-badge-price">${isFree ? 'FREE' : `$${c.price.toFixed(2)}`}</span>
          </div>
          <div class="course-card-body">
            <div class="course-category-tag">${c.category}</div>
            <h3 class="course-title">${c.title}</h3>
            <p class="course-subtitle">${c.subtitle || c.description}</p>
            
            <div class="course-instructor-meta">
              <img src="${c.instructor ? c.instructor.avatar : ''}" alt="${c.instructor ? c.instructor.name : ''}" class="instructor-avatar-sm" />
              <span class="instructor-name-sm">${c.instructor ? c.instructor.name : 'Learnify Faculty'}</span>
            </div>

            <div class="course-footer-stats">
              <div class="course-rating">
                ★ ${c.averageRating ? c.averageRating.toFixed(1) : '5.0'} 
                <span style="font-weight: 400; color: var(--text-dim);">(${c.ratingsCount || 1})</span>
              </div>
              <div class="course-duration">⏱️ ${c.durationHours} hrs</div>
            </div>

            <div style="margin-top: 1.2rem;">
              <button class="btn btn-primary" style="width: 100%;" onclick="openCoursePlayer('${c._id}')">
                View Syllabus & Start
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; color: #f43f5e; text-align: center;">Error loading courses: ${err.message}</div>`;
  }
}

// ==========================================
// 2. COURSE PLAYER & LESSON VIEWER
// ==========================================
window.openCoursePlayer = async function (courseId) {
  try {
    const courseRes = await api.getCourse(courseId);
    state.currentCourse = courseRes.course;
    const isEnrolled = courseRes.isEnrolled;

    let progressData = { progressPercentage: 0, completedLessons: [] };
    if (isEnrolled) {
      try {
        progressData = await api.getCourseProgress(courseId);
      } catch (e) {}
    }

    const modalOverlay = document.getElementById('playerModal');
    const modalContent = document.getElementById('playerModalContent');

    const lessons = state.currentCourse.lessons || [];
    const firstLesson = lessons[0] || null;
    state.currentLesson = firstLesson;

    renderPlayerModal(isEnrolled, progressData);
    modalOverlay.classList.add('active');

    if (firstLesson) {
      loadLessonContent(firstLesson._id);
    }
  } catch (err) {
    alert('Failed to load course details: ' + err.message);
  }
};

function renderPlayerModal(isEnrolled, progressData) {
  const modalContent = document.getElementById('playerModalContent');
  const course = state.currentCourse;
  const lessons = course.lessons || [];
  const pct = progressData.progressPercentage || 0;
  const completedIds = (progressData.completedLessons || []).map((l) => (l._id ? l._id.toString() : l.toString()));

  modalContent.innerHTML = `
    <div class="modal-header">
      <div>
        <span class="course-category-tag">${course.category} • ${course.level}</span>
        <h2 class="modal-title">${course.title}</h2>
      </div>
      <button class="modal-close-btn" onclick="closePlayerModal()">&times;</button>
    </div>

    <div class="modal-body">
      <div class="player-layout">
        <!-- Left: Player & Lesson Text -->
        <div>
          <div class="video-container" id="videoContainer">
            <iframe 
              id="lessonVideoFrame"
              src="https://www.youtube-nocookie.com/embed/WDrU305J1yw" 
              title="Lesson Video" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>

          <div class="lesson-content-card" id="lessonDetailsCard">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 id="lessonTitleHeader">Loading lesson...</h3>
              <div id="lessonActionBtnWrap"></div>
            </div>
            <div id="lessonBodyText" style="color: var(--text-muted); line-height: 1.7;"></div>
          </div>
        </div>

        <!-- Right: Syllabus & Progress -->
        <div class="syllabus-sidebar">
          <div class="glass-card syllabus-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4>Course Progress</h4>
              <span style="font-weight: 800; color: #10b981;" id="progressPctText">${pct}%</span>
            </div>
            
            <div class="progress-track" style="margin: 0.8rem 0;">
              <div class="progress-fill" id="modalProgressFill" style="width: ${pct}%;"></div>
            </div>

            ${
              !isEnrolled
                ? `
                <button class="btn btn-accent" style="width: 100%; margin-top: 0.5rem;" onclick="enrollCurrentCourse()">
                  🚀 Enroll for Free (Instant Access)
                </button>
              `
                : `
                <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.8rem;">
                  <button class="btn btn-primary btn-sm" onclick="openQuizModal()">
                    📝 Take Course Assessment Quiz
                  </button>
                  <button class="btn ${pct === 100 ? 'btn-accent' : 'btn-secondary'} btn-sm" onclick="claimCourseCertificate()" id="claimCertBtn" ${pct < 100 ? 'disabled style="opacity: 0.6;"' : ''}>
                    📜 ${pct === 100 ? 'Claim Verified Certificate!' : 'Certificate Locked (100% Required)'}
                  </button>
                </div>
              `
            }
          </div>

          <div class="glass-card syllabus-card" style="flex: 1;">
            <h4 style="margin-bottom: 0.5rem;">Syllabus (${lessons.length} Lessons)</h4>
            <ul class="syllabus-list">
              ${lessons
                .map((les, index) => {
                  const isDone = completedIds.includes(les._id.toString());
                  return `
                  <li>
                    <button 
                      class="lesson-item-btn ${index === 0 ? 'active' : ''} ${isDone ? 'completed' : ''}" 
                      id="lesson-item-${les._id}"
                      onclick="loadLessonContent('${les._id}')">
                      <div>
                        <div style="font-weight: 600; font-size: 0.88rem; color: #fff;">${les.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-dim);">⏱️ ${les.durationMinutes} mins</div>
                      </div>
                      <div>
                        ${isDone ? '<span class="lesson-check-icon">✓</span>' : les.isFreePreview ? '<span style="font-size: 0.68rem; background: rgba(56,189,248,0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">PREVIEW</span>' : ''}
                      </div>
                    </button>
                  </li>
                `;
                })
                .join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.loadLessonContent = async function (lessonId) {
  try {
    document.querySelectorAll('.lesson-item-btn').forEach((b) => b.classList.remove('active'));
    const activeBtn = document.getElementById(`lesson-item-${lessonId}`);
    if (activeBtn) activeBtn.classList.add('active');

    const res = await api.getLesson(lessonId);
    state.currentLesson = res.lesson;

    const titleElem = document.getElementById('lessonTitleHeader');
    const bodyElem = document.getElementById('lessonBodyText');
    const videoFrame = document.getElementById('lessonVideoFrame');
    const actionWrap = document.getElementById('lessonActionBtnWrap');

    if (titleElem) titleElem.textContent = state.currentLesson.title;
    if (bodyElem) {
      bodyElem.innerHTML = state.currentLesson.content
        ? formatMarkdown(state.currentLesson.content)
        : '<p>Welcome to this lesson! Follow the video instructions and test the principles in code.</p>';
    }
    if (videoFrame && state.currentLesson.videoUrl) {
      videoFrame.src = state.currentLesson.videoUrl;
    }

    if (actionWrap) {
      actionWrap.innerHTML = `
        <button class="btn btn-accent btn-sm" onclick="markLessonComplete('${lessonId}')">
          ✓ Mark Lesson Completed
        </button>
      `;
    }
  } catch (err) {
    alert(err.message);
  }
};

window.enrollCurrentCourse = async function () {
  try {
    const res = await api.enroll(state.currentCourse._id);
    alert(res.message || 'Enrolled successfully!');
    // Reload player with enrollment
    await openCoursePlayer(state.currentCourse._id);
  } catch (err) {
    alert('Enrollment error: ' + err.message);
  }
};

window.markLessonComplete = async function (lessonId) {
  try {
    const res = await api.completeLesson(state.currentCourse._id, lessonId);
    
    // Update progress bar
    const progressFill = document.getElementById('modalProgressFill');
    const progressText = document.getElementById('progressPctText');
    const claimBtn = document.getElementById('claimCertBtn');
    const itemBtn = document.getElementById(`lesson-item-${lessonId}`);

    if (progressFill) progressFill.style.width = `${res.progressPercentage}%`;
    if (progressText) progressText.textContent = `${res.progressPercentage}%`;
    if (itemBtn) itemBtn.classList.add('completed');

    if (res.progressPercentage === 100) {
      alert('🎉 100% Course Completed! You are now eligible to take the quiz and claim your verified Certificate!');
      if (claimBtn) {
        claimBtn.removeAttribute('disabled');
        claimBtn.style.opacity = '1';
        claimBtn.className = 'btn btn-accent btn-sm';
        claimBtn.textContent = '📜 Claim Verified Certificate!';
      }
    }
  } catch (err) {
    alert('Error marking lesson complete: ' + err.message);
  }
};

window.claimCourseCertificate = async function () {
  try {
    const res = await api.issueCertificate(state.currentCourse._id);
    closePlayerModal();
    showCertificateModal(res.certificate);
  } catch (err) {
    alert('Certificate Issuance: ' + err.message);
  }
};

window.closePlayerModal = function () {
  const modal = document.getElementById('playerModal');
  if (modal) modal.classList.remove('active');
};

// ==========================================
// 3. ASSESSMENT QUIZ MODAL
// ==========================================
window.openQuizModal = async function () {
  try {
    const res = await api.getQuiz(state.currentCourse._id);
    state.currentQuiz = res.quiz;
    state.quizAnswers = {};

    const modal = document.getElementById('quizModal');
    const body = document.getElementById('quizModalBody');

    body.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <span class="course-category-tag">Assessment Assessment</span>
        <h2>${state.currentQuiz.title}</h2>
        <p style="color: var(--text-muted);">${state.currentQuiz.description}</p>
        <p style="color: #38bdf8; font-size: 0.85rem; margin-top: 0.4rem;">Passing Score: <strong>${state.currentQuiz.passingScorePercentage}%</strong></p>
      </div>

      <form id="quizForm" onsubmit="submitQuizAttempt(event)">
        ${state.currentQuiz.questions
          .map(
            (q, qIdx) => `
          <div class="quiz-question-box">
            <h4 style="margin-bottom: 0.8rem;">Q${qIdx + 1}: ${q.question}</h4>
            <div>
              ${q.options
                .map(
                  (opt, oIdx) => `
                <label class="quiz-option-label" id="q_${qIdx}_opt_${oIdx}">
                  <input type="radio" name="question_${qIdx}" value="${oIdx}" required onchange="handleQuizSelect(${qIdx}, ${oIdx})" />
                  <span>${opt}</span>
                </label>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="closeQuizModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Submit Answers & Calculate Score</button>
        </div>
      </form>
      <div id="quizResultFeedback" style="margin-top: 1.5rem;"></div>
    `;

    modal.classList.add('active');
  } catch (err) {
    alert('Quiz Error: ' + err.message);
  }
};

window.handleQuizSelect = function (qIdx, oIdx) {
  state.quizAnswers[qIdx] = oIdx;
  document.querySelectorAll(`[id^="q_${qIdx}_opt_"]`).forEach((el) => el.classList.remove('selected'));
  const selectedLabel = document.getElementById(`q_${qIdx}_opt_${oIdx}`);
  if (selectedLabel) selectedLabel.classList.add('selected');
};

window.submitQuizAttempt = async function (e) {
  e.preventDefault();
  try {
    const answersArray = state.currentQuiz.questions.map((_, idx) => state.quizAnswers[idx]);
    const res = await api.submitQuiz(state.currentQuiz._id, answersArray);

    const feedback = document.getElementById('quizResultFeedback');
    feedback.innerHTML = `
      <div class="glass-card" style="padding: 1.5rem; border-color: ${res.summary.passed ? '#10b981' : '#f43f5e'};">
        <h3 style="color: ${res.summary.passed ? '#10b981' : '#f43f5e'}; margin-bottom: 0.5rem;">
          ${res.summary.message}
        </h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Score: <strong>${res.summary.scorePercentage}%</strong> (${res.summary.correctCount} of ${res.summary.totalQuestions} correct)
        </p>
        
        <div style="margin-top: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;">
          ${res.results
            .map(
              (r, i) => `
            <div style="background: rgba(255,255,255,0.03); padding: 0.8rem; border-radius: 8px; border-left: 4px solid ${r.isCorrect ? '#10b981' : '#f43f5e'};">
              <div style="font-weight: 600; font-size: 0.88rem;">Q${i + 1}: ${r.question}</div>
              <div style="font-size: 0.8rem; color: ${r.isCorrect ? '#10b981' : '#f43f5e'}; margin-top: 4px;">
                ${r.isCorrect ? '✓ Correct' : '✗ Incorrect'} — Explanation: ${r.explanation}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  } catch (err) {
    alert('Quiz submission failed: ' + err.message);
  }
};

window.closeQuizModal = function () {
  const modal = document.getElementById('quizModal');
  if (modal) modal.classList.remove('active');
};

// ==========================================
// 4. STUDENT DASHBOARD VIEW
// ==========================================
async function renderStudentDashboard() {
  const content = document.getElementById('appContent');
  if (!state.currentUser) {
    content.innerHTML = `
      <div class="glass-card" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 3rem auto; border-radius: 20px;">
        <div style="font-size: 3.5rem; margin-bottom: 1.2rem;">🔐</div>
        <h2 style="font-size: 1.8rem; margin-bottom: 0.8rem; color: #fff;">Sign In to Your Student Portal</h2>
        <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
          Track your course progress, continue lessons, take auto-graded quizzes, and view cryptographically verified certificates.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="openAuthModal('login')">Sign In</button>
          <button class="btn btn-secondary" onclick="openAuthModal('register')">Create Free Account</button>
          <button class="btn btn-accent" onclick="fillQuickLogin('alex.morgan@student.io', 'Password123!'); openAuthModal('login');">⚡ Demo Login (Alex)</button>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="margin-bottom: 2.5rem;">
      <span class="course-category-tag">Student Dashboard</span>
      <h2>Welcome back, ${state.currentUser ? state.currentUser.name : 'Student'}!</h2>
      <p style="color: var(--text-muted);">Track your active courses, lesson progress, and official certificates.</p>
    </div>

    <!-- Student KPI Stats -->
    <div class="analytics-grid" id="studentStatsGrid">
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Enrolled Courses</span>
          <div class="kpi-icon" style="background: rgba(99,102,241,0.2); color: #818cf8;">📚</div>
        </div>
        <div class="kpi-value" id="sKpiEnrolled">-</div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Completed Courses</span>
          <div class="kpi-icon" style="background: rgba(16,185,129,0.2); color: #10b981;">🎓</div>
        </div>
        <div class="kpi-value" id="sKpiCompleted">-</div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Lessons Finished</span>
          <div class="kpi-icon" style="background: rgba(6,182,212,0.2); color: #06b6d4;">✓</div>
        </div>
        <div class="kpi-value" id="sKpiLessons">-</div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Certificates Earned</span>
          <div class="kpi-icon" style="background: rgba(168,85,247,0.2); color: #a855f7;">📜</div>
        </div>
        <div class="kpi-value" id="sKpiCerts">-</div>
      </div>
    </div>

    <h3 style="margin-bottom: 1.2rem;">My Enrolled Courses</h3>
    <div id="studentEnrollmentsGrid" class="courses-grid" style="margin-bottom: 3rem;">
      <p style="color: var(--text-muted)">Loading enrollments...</p>
    </div>

    <h3 style="margin-bottom: 1.2rem;">Official Earned Certificates</h3>
    <div id="studentCertificatesList" class="courses-grid">
      <p style="color: var(--text-muted)">Loading certificates...</p>
    </div>
  `;

  try {
    const [analyticsRes, enrollRes, certRes] = await Promise.all([
      api.getStudentAnalytics(),
      api.getMyEnrollments(),
      api.getMyCertificates()
    ]);

    const stats = analyticsRes.stats || {};
    document.getElementById('sKpiEnrolled').textContent = stats.totalEnrolled || 0;
    document.getElementById('sKpiCompleted').textContent = stats.completedCourses || 0;
    document.getElementById('sKpiLessons').textContent = stats.totalCompletedLessons || 0;
    document.getElementById('sKpiCerts').textContent = analyticsRes.certificatesCount || 0;

    // Enrollments
    const enrollGrid = document.getElementById('studentEnrollmentsGrid');
    if (enrollRes.enrollments.length === 0) {
      enrollGrid.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; padding: 2rem; text-align: center;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">You have not enrolled in any courses yet.</p>
          <a href="#courses" class="btn btn-primary">Browse Catalog</a>
        </div>
      `;
    } else {
      enrollGrid.innerHTML = enrollRes.enrollments
        .map((enr) => {
          const c = enr.course;
          return `
          <div class="glass-card course-card">
            <div class="course-thumb-wrap">
              <img src="${c.thumbnail}" class="course-thumb" alt="${c.title}" />
              <span class="course-badge-level">${c.level}</span>
            </div>
            <div class="course-card-body">
              <span class="course-category-tag">${c.category}</span>
              <h3 class="course-title">${c.title}</h3>

              <div style="margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.3rem;">
                  <span>Progress</span>
                  <span style="font-weight: 700; color: #10b981;">${enr.progressPercentage}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${enr.progressPercentage}%;"></div>
                </div>
              </div>

              <div style="display: flex; gap: 0.8rem; margin-top: auto;">
                <button class="btn btn-primary" style="flex: 1;" onclick="openCoursePlayer('${c._id}')">
                  ${enr.progressPercentage === 100 ? 'Review Course' : 'Resume Learning'}
                </button>
                ${
                  enr.hasCertificate
                    ? `<button class="btn btn-accent btn-sm" onclick="viewCertificateById('${enr.certificateId}')">View Cert</button>`
                    : ''
                }
              </div>
            </div>
          </div>
        `;
        })
        .join('');
    }

    // Certificates
    const certList = document.getElementById('studentCertificatesList');
    if (certRes.certificates.length === 0) {
      certList.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; padding: 2rem; text-align: center;">
          <p style="color: var(--text-muted)">No certificates earned yet. Complete 100% of a course and pass its assessment to unlock your official credential!</p>
        </div>
      `;
    } else {
      certList.innerHTML = certRes.certificates
        .map(
          (cert) => `
        <div class="glass-card" style="padding: 1.5rem; border: 1px solid rgba(168,85,247,0.3);">
          <span style="font-size: 0.75rem; color: #a855f7; font-weight: 700;">VERIFIED CREDENTIAL</span>
          <h3 style="margin: 0.4rem 0 0.8rem 0;">${cert.course ? cert.course.title : 'Course'}</h3>
          <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1rem;">ID: <code>${cert.certificateId}</code></p>
          <button class="btn btn-primary btn-sm" onclick="viewCertificateById('${cert.certificateId}')">
            📜 View Certificate
          </button>
        </div>
      `
        )
        .join('');
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// 5. INSTRUCTOR STUDIO (MONGODB AGGREGATIONS)
// ==========================================
async function renderInstructorAnalytics() {
  const content = document.getElementById('appContent');
  if (!state.currentUser) {
    content.innerHTML = `
      <div class="glass-card" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 3rem auto; border-radius: 20px;">
        <div style="font-size: 3.5rem; margin-bottom: 1.2rem;">👨‍🏫</div>
        <h2 style="font-size: 1.8rem; margin-bottom: 0.8rem; color: #fff;">Instructor Studio Access</h2>
        <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem;">
          Sign in with an Instructor account to view real-time MongoDB aggregation metrics, course enrollments, and student completion analytics.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="openAuthModal('login')">Sign In</button>
          <button class="btn btn-secondary" onclick="openAuthModal('register')">Register as Instructor</button>
          <button class="btn btn-accent" onclick="fillQuickLogin('sarah.chen@learnify.io', 'Password123!'); openAuthModal('login');">⚡ Demo Login (Dr. Chen)</button>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
      <div>
        <span class="course-category-tag">Instructor Analytics & Mongoose Aggregation Pipelines</span>
        <h2>Instructor Studio</h2>
        <p style="color: var(--text-muted);">Real-time metrics powered by MongoDB multi-stage <code>$lookup</code>, <code>$group</code>, <code>$unwind</code>, and <code>$project</code> pipelines.</p>
      </div>
      <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem; color: #818cf8;">
        Live Instructor: <strong>${state.currentUser ? state.currentUser.name : 'Dr. Sarah Chen'}</strong>
      </div>
    </div>

    <!-- Aggregated KPIs -->
    <div class="analytics-grid" id="instructorKpiGrid">
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Active Courses</span>
          <div class="kpi-icon" style="background: rgba(99,102,241,0.2); color: #818cf8;">📚</div>
        </div>
        <div class="kpi-value" id="iKpiCourses">-</div>
        <div class="kpi-meta">Pipeline: <code>$addToSet: '$_id'</code></div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Total Students Enrolled</span>
          <div class="kpi-icon" style="background: rgba(6,182,212,0.2); color: #06b6d4;">👥</div>
        </div>
        <div class="kpi-value" id="iKpiStudents">-</div>
        <div class="kpi-meta">Pipeline: <code>$lookup -> $unwind -> $sum</code></div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Gross Revenue</span>
          <div class="kpi-icon" style="background: rgba(16,185,129,0.2); color: #10b981;">💰</div>
        </div>
        <div class="kpi-value" id="iKpiRevenue">-</div>
        <div class="kpi-meta">Pipeline: <code>$sum: '$price'</code></div>
      </div>

      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">Avg Completion Rate</span>
          <div class="kpi-icon" style="background: rgba(245,158,11,0.2); color: #f59e0b;">📈</div>
        </div>
        <div class="kpi-value" id="iKpiCompletion">-</div>
        <div class="kpi-meta">Pipeline: <code>$avg: '$progressPercentage'</code></div>
      </div>
    </div>

    <!-- Performance Breakdown Table -->
    <h3 style="margin-bottom: 1rem;">Course Enrollment & Revenue Breakdown</h3>
    <div class="glass-card table-wrap" style="margin-bottom: 2.5rem;">
      <table class="styled-table" id="instructorCourseTable">
        <thead>
          <tr>
            <th>Course Title</th>
            <th>Category</th>
            <th>Level</th>
            <th>Price</th>
            <th>Enrolled Students</th>
            <th>Revenue</th>
            <th>Avg Rating</th>
          </tr>
        </thead>
        <tbody id="instructorCourseTableBody">
          <tr><td colspan="7" style="text-align: center; color: var(--text-dim);">Running aggregation pipeline...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Mongoose Pipeline Interview Showcase Box -->
    <div class="glass-card" style="padding: 1.8rem; border-left: 4px solid #818cf8;">
      <h4 style="margin-bottom: 0.5rem; color: #818cf8;">💡 Placement Interview Highlight: MongoDB Aggregation Pipeline</h4>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
        The stats above are computed dynamically by Express querying Mongoose via multi-stage pipelines:
      </p>
      <pre style="background: #090c14; padding: 1rem; border-radius: 8px; font-size: 0.82rem; overflow-x: auto; color: #a5b4fc;">
Course.aggregate([
  { $match: { instructor: instructorId } },
  { $lookup: { from: 'enrollments', localField: '_id', foreignField: 'course', as: 'enrollments' } },
  { $unwind: { path: '$enrollments', preserveNullAndEmptyArrays: true } },
  { $group: {
      _id: null,
      totalCourses: { $addToSet: '$_id' },
      totalEnrollments: { $sum: { $cond: [{ $ifNull: ['$enrollments._id', false] }, 1, 0] } },
      totalRevenue: { $sum: { $cond: [{ $ifNull: ['$enrollments._id', false] }, '$price', 0] } },
      avgCompletionRate: { $avg: '$enrollments.progressPercentage' }
    }
  }
])
      </pre>
    </div>
  `;

  try {
    const res = await api.getInstructorAnalytics();
    const kpis = res.kpis || {};

    document.getElementById('iKpiCourses').textContent = kpis.totalCoursesCount || 0;
    document.getElementById('iKpiStudents').textContent = kpis.totalEnrollments || 0;
    document.getElementById('iKpiRevenue').textContent = `$${(kpis.totalRevenue || 0).toFixed(2)}`;
    document.getElementById('iKpiCompletion').textContent = `${kpis.avgCompletionRate || 0}%`;

    const tbody = document.getElementById('instructorCourseTableBody');
    if (res.courseBreakdown && res.courseBreakdown.length > 0) {
      tbody.innerHTML = res.courseBreakdown
        .map(
          (c) => `
        <tr>
          <td><strong>${c.title}</strong></td>
          <td><span class="course-category-tag">${c.category}</span></td>
          <td>${c.level}</td>
          <td>${c.price === 0 ? 'FREE' : `$${c.price}`}</td>
          <td><strong style="color: #06b6d4;">${c.studentCount}</strong></td>
          <td><strong style="color: #10b981;">$${(c.estimatedRevenue || 0).toFixed(2)}</strong></td>
          <td>★ ${c.averageRating ? c.averageRating.toFixed(1) : '5.0'}</td>
        </tr>
      `
        )
        .join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim);">No courses created by this instructor yet.</td></tr>`;
    }
  } catch (err) {
    console.error('Instructor stats error:', err);
  }
}

// ==========================================
// 6. CERTIFICATE VERIFICATION VIEW
// ==========================================
function renderVerifyView() {
  const content = document.getElementById('appContent');
  content.innerHTML = `
    <div style="text-align: center; max-width: 700px; margin: 0 auto;">
      <span class="course-category-tag">Public Credential Checker</span>
      <h2 style="font-size: 2.2rem; margin: 0.5rem 0 1rem 0;">Verify Learnify Certificate</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">
        Official cryptographically validated credential ledger. Try checking demo certificate <code>LMS-2026-ARCH9901</code>.
      </p>

      <div class="glass" style="display: flex; gap: 0.8rem; padding: 0.8rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
        <input 
          type="text" 
          id="certInputCode" 
          class="search-input" 
          placeholder="Enter Certificate Code (e.g. LMS-2026-ARCH9901)" 
          value="LMS-2026-ARCH9901"
        />
        <button class="btn btn-primary" onclick="verifyCertificateCode()">Verify Authenticity</button>
      </div>

      <div id="certVerificationResult"></div>
    </div>
  `;
}

window.verifyCertificateCode = async function () {
  const code = document.getElementById('certInputCode').value.trim();
  const resultDiv = document.getElementById('certVerificationResult');
  if (!code) return;

  resultDiv.innerHTML = '<p style="color: var(--text-muted)">Verifying credential records...</p>';

  try {
    const res = await api.verifyCertificate(code);
    const cert = res.certificate;

    resultDiv.innerHTML = `
      <div class="certificate-preview-box">
        <div class="cert-watermark">🎓</div>
        <div class="cert-logo">🎓 LEARNIFY OFFICIAL CREDENTIAL</div>
        <div style="color: #10b981; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em;">
          ✓ OFFICIALLY VALIDATED & VERIFIED
        </div>

        <p style="color: var(--text-dim); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem;">
          This certifies that
        </p>
        
        <h2 class="cert-student-name">${cert.studentName}</h2>

        <p style="color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem;">
          has successfully mastered all lessons and passed the final assessment for
        </p>

        <h3 class="cert-course-title">${cert.courseTitle}</h3>
        <span class="course-category-tag">${cert.courseCategory}</span>

        <div class="cert-footer-meta">
          <div>
            <div>Certificate ID: <strong>${cert.certificateId}</strong></div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">SHA256 Hash: ${cert.verificationHash.slice(0, 16)}...</div>
          </div>
          <div>
            <div>Issued: <strong>${new Date(cert.issuedAt).toLocaleDateString()}</strong></div>
            <div style="color: #a855f7; font-weight: 600;">Grade: ${cert.grade}</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `
      <div class="glass-card" style="padding: 2rem; border-color: #f43f5e; text-align: center;">
        <h3 style="color: #f43f5e; margin-bottom: 0.5rem;">❌ Verification Failed</h3>
        <p style="color: var(--text-muted);">${err.message}</p>
      </div>
    `;
  }
};

window.viewCertificateById = async function (certId) {
  try {
    const res = await api.verifyCertificate(certId);
    showCertificateModal(res.certificate);
  } catch (err) {
    alert('Certificate: ' + err.message);
  }
};

function showCertificateModal(cert) {
  const modal = document.getElementById('certModal');
  const body = document.getElementById('certModalBody');

  body.innerHTML = `
    <div class="certificate-preview-box">
      <div class="cert-watermark">🎓</div>
      <div class="cert-logo">🎓 LEARNIFY OFFICIAL CREDENTIAL</div>
      <div style="color: #10b981; font-weight: 700; font-size: 0.85rem;">✓ OFFICIALLY VALIDATED & VERIFIED</div>

      <p style="color: var(--text-dim); margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem;">
        This certifies that
      </p>
      
      <h2 class="cert-student-name">${cert.studentName || (cert.student ? cert.student.name : 'Student')}</h2>

      <p style="color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem;">
        has successfully completed the comprehensive curriculum of
      </p>

      <h3 class="cert-course-title">${cert.courseTitle || (cert.course ? cert.course.title : 'Course')}</h3>

      <div class="cert-footer-meta">
        <div>
          <div>Certificate ID: <strong>${cert.certificateId}</strong></div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">Verification Hash: ${cert.verificationHash.slice(0, 18)}...</div>
        </div>
        <div>
          <div>Date: <strong>${new Date(cert.issuedAt).toLocaleDateString()}</strong></div>
          <div style="color: #a855f7; font-weight: 600;">Grade: ${cert.grade || 'Passed with Distinction'}</div>
        </div>
      </div>
    </div>
    
    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
      <button class="btn btn-secondary" onclick="closeCertModal()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF</button>
    </div>
  `;

  modal.classList.add('active');
}

window.closeCertModal = function () {
  const modal = document.getElementById('certModal');
  if (modal) modal.classList.remove('active');
};

// ==========================================
// 7. REST API & SCHEMA EXPLORER
// ==========================================
function renderApiDocsView() {
  const content = document.getElementById('appContent');
  content.innerHTML = `
    <div style="margin-bottom: 2.5rem;">
      <span class="course-category-tag">Architecture & Placement Interview Cheatsheet</span>
      <h2>Learnify REST API & MongoDB Schema Explorer</h2>
      <p style="color: var(--text-muted);">
        Interactive documentation showing all production endpoints, HTTP status codes, Mongoose models, and Aggregation stages.
      </p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1.2rem;">
      <div class="api-endpoint-card">
        <div>
          <span class="badge-method badge-get">GET</span>
          <strong style="font-size: 1.05rem;">/api/courses</strong>
          <span style="color: var(--text-dim); margin-left: 1rem;">Filter, sort, text-search and paginated course query</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0;">Query params: <code>?category=&level=&search=&sort=&page=&limit=</code></p>
        <button class="btn btn-secondary btn-sm" onclick="testEndpoint('/api/courses?limit=2')">Test Live Endpoint</button>
      </div>

      <div class="api-endpoint-card">
        <div>
          <span class="badge-method badge-get">GET</span>
          <strong style="font-size: 1.05rem;">/api/analytics/instructor</strong>
          <span style="color: var(--text-dim); margin-left: 1rem;">Protected multi-stage MongoDB aggregation pipeline</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0;">Stages: <code>$match -> $lookup -> $unwind -> $group -> $project</code></p>
        <button class="btn btn-secondary btn-sm" onclick="testEndpoint('/api/analytics/instructor')">Test Live Endpoint</button>
      </div>

      <div class="api-endpoint-card">
        <div>
          <span class="badge-method badge-post">POST</span>
          <strong style="font-size: 1.05rem;">/api/courses/:courseId/enroll</strong>
          <span style="color: var(--text-dim); margin-left: 1rem;">Enroll student with compound unique index constraint</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0;">Model: <code>EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true })</code></p>
      </div>

      <div class="api-endpoint-card">
        <div>
          <span class="badge-method badge-get">GET</span>
          <strong style="font-size: 1.05rem;">/api/certificates/verify/:certificateId</strong>
          <span style="color: var(--text-dim); margin-left: 1rem;">Public verification endpoint with SHA256 integrity hash</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="testEndpoint('/api/certificates/verify/LMS-2026-ARCH9901')">Test Live Endpoint</button>
      </div>

      <div class="api-endpoint-card">
        <div>
          <span class="badge-method badge-get">GET</span>
          <strong style="font-size: 1.05rem;">/api/analytics/platform</strong>
          <span style="color: var(--text-dim); margin-left: 1rem;">Platform-wide analytics with role distribution</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="testEndpoint('/api/analytics/platform')">Test Live Endpoint</button>
      </div>
    </div>

    <div id="apiTestResultBox" style="margin-top: 2rem; display: none;">
      <h4>Live JSON Response:</h4>
      <pre id="apiTestJsonOutput" style="background: #090c14; padding: 1.2rem; border-radius: 8px; font-size: 0.82rem; overflow-x: auto; color: #10b981; border: 1px solid var(--border-color);"></pre>
    </div>
  `;
}

window.testEndpoint = async function (endpoint) {
  const resultBox = document.getElementById('apiTestResultBox');
  const jsonOutput = document.getElementById('apiTestJsonOutput');
  resultBox.style.display = 'block';
  jsonOutput.textContent = 'Executing request...';

  try {
    const res = await api.request(endpoint.replace('/api', ''));
    jsonOutput.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    jsonOutput.textContent = 'Error: ' + err.message;
  }
};

// Utilities
function formatMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, '<h4 style="margin: 1.2rem 0 0.5rem 0; color: #fff;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin: 1.5rem 0 0.6rem 0; color: #fff;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="margin: 1.8rem 0 0.8rem 0; color: #fff;">$1</h2>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/```javascript([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/\n/gim, '<br />');
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Subscription & Footer Interactive Handlers
window.handleStartSubscription = function () {
  const modal = document.getElementById('subSuccessModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    alert("🎉 Welcome to Personal Plan! Your subscription is active at ₹500.00/mo. Enjoy unlimited courses, labs, and certification practice tests.");
  }
};

window.closeSubModal = function () {
  const modal = document.getElementById('subSuccessModal');
  if (modal) {
    modal.classList.remove('active');
  }
};

window.scrollToPlans = function () {
  const subSec = document.getElementById('subscriptionSection');
  if (state.activeTab !== 'courses') {
    state.activeTab = 'courses';
    window.location.hash = 'courses';
  }
  if (subSec) {
    subSec.style.display = 'block';
    subSec.scrollIntoView({ behavior: 'smooth' });
  }
};

window.filterByKeyword = function (keyword) {
  state.activeTab = 'courses';
  window.location.hash = 'courses';
  state.filter.search = keyword || '';
  const searchInput = document.getElementById('courseSearchInput');
  if (searchInput) {
    searchInput.value = keyword || '';
  }
  loadCoursesGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openAboutModal = function () {
  alert("🎓 Learnify LMS — Next-Generation Learning Management System\n\nBuilt on MongoDB & Mongoose with aggregation pipelines, machine learning predictive analytics, role-based JWT auth, real-time quizzes, and verifiable credentials.");
};

// ==========================================
// AUTHENTICATION MODAL & HANDLERS (Login, Logout, Register)
// ==========================================
window.openAuthModal = function (tab = 'login') {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    switchAuthTab(tab);
  }
};

window.closeAuthModal = function () {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
  }
};

window.switchAuthTab = function (tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('authTabLoginBtn');
  const registerBtn = document.getElementById('authTabRegisterBtn');
  const loginAlert = document.getElementById('loginAlert');
  const registerAlert = document.getElementById('registerAlert');

  if (loginAlert) loginAlert.style.display = 'none';
  if (registerAlert) registerAlert.style.display = 'none';

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (loginBtn) loginBtn.classList.add('active');
    if (registerBtn) registerBtn.classList.remove('active');
    const emailInput = document.getElementById('loginEmail');
    if (emailInput) setTimeout(() => emailInput.focus(), 100);
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (loginBtn) loginBtn.classList.remove('active');
    if (registerBtn) registerBtn.classList.add('active');
    const nameInput = document.getElementById('registerName');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }
};

window.fillQuickLogin = function (email, password) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  switchAuthTab('login');
};

window.submitLogin = async function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (!email || !password) {
    if (alertBox) {
      alertBox.textContent = 'Please provide both email and password.';
      alertBox.style.display = 'block';
    }
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    if (alertBox) alertBox.style.display = 'none';

    const res = await api.login(email, password);
    state.currentUser = res.user;
    updateUserUI();
    closeAuthModal();
    renderCurrentTab();
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = err.message || 'Login failed. Please verify credentials.';
      alertBox.style.display = 'block';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to Learnify';
  }
};

window.submitRegister = async function (e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  const headline = document.getElementById('registerHeadline').value.trim();
  const alertBox = document.getElementById('registerAlert');
  const submitBtn = document.getElementById('registerSubmitBtn');

  if (!name || !email || !password) {
    if (alertBox) {
      alertBox.textContent = 'Please fill out all required fields.';
      alertBox.style.display = 'block';
    }
    return;
  }

  if (password.length < 6) {
    if (alertBox) {
      alertBox.textContent = 'Password must be at least 6 characters.';
      alertBox.style.display = 'block';
    }
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    if (alertBox) alertBox.style.display = 'none';

    const res = await api.register({
      name,
      email,
      password,
      role: role || 'student',
      headline: headline || 'Learner & Developer'
    });

    state.currentUser = res.user;
    updateUserUI();
    closeAuthModal();
    renderCurrentTab();
    alert(`🎉 Welcome to Learnify, ${res.user.name}! Your account has been registered.`);
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = err.message || 'Registration failed.';
      alertBox.style.display = 'block';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account & Start Learning';
  }
};

window.handleLogout = function () {
  if (confirm('Are you sure you want to log out of Learnify?')) {
    api.logout();
    state.currentUser = null;
    updateUserUI();
    renderCurrentTab();
  }
};
