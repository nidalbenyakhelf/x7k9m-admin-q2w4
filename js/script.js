import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ بيانات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyC5UjzMRr9BOBtuBIbI6sThWtv3BI0HPzo",
  authDomain: "feedbacksoftskils.firebaseapp.com",
  projectId: "feedbacksoftskils",
  storageBucket: "feedbacksoftskils.firebasestorage.app",
  messagingSenderId: "347396669754",
  appId: "1:347396669754:web:54344c7c874b7cdb11d003"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SESSION_NAMES = {
    'session1': 'محاضرة: دور المهارات الناعمة في بناء الشخصية - أ. اسكندر زينب',
    'session2': 'ورشة: التسويق الإلكتروني والاتصال الفعال - أ. أحمد بن عدة',
    'session3': 'ورشة إلكترونية: براندينغ وبناء الهوية الشخصية الاحترافية - أ. عمراوي عبد الوحيد',
    'session4': 'ورشة: فن اتخاذ القرار - أ. عبد الخالق بن بحة',
    'session5': 'ورشة: التخطيط الاستراتيجي - أ. وعراب محمد',
    'session6': 'ورشة إلكترونية: ذكاء الاصطناعي وهندسة الأوامر - أ. طيبي عبد الجليل',
    'session7': 'ورشة: التخطيط الاستراتيجي لإدارة الفعاليات غير الربحية - أ. محمد إسلام تكدونتي',
    'session8': 'ورشة: حول إدارة الضغط النفسي',
    'session9': 'ورشة: فن الإلقاء والخطابة - أ. عمر يخلف',
    'other': 'جلسة أخرى'
};

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('id');

if (!sessionId || !SESSION_NAMES[sessionId]) {
    document.getElementById('loadingState').innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-circle-exclamation"></i>
            <h3 class="fw-bold mt-3">رابط غير صالح</h3>
            <p>هذا الرابط غير صحيح أو الجلسة غير موجودة</p>
        </div>`;
} else {
    document.getElementById('sessionTitle').textContent = SESSION_NAMES[sessionId];
    loadSessionData(sessionId);
}

async function loadSessionData(sessionId) {
    try {
        const q = query(collection(db, "feedback"), where("sessionName", "==", sessionId));
        const snapshot = await getDocs(q);
        
        const data = [];
        snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));

        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        renderSummary(data, sessionId);
        renderDetailedRating(data);
        renderFeedbackList(data);

    } catch (error) {
        console.error(error);
        document.getElementById('loadingState').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3 class="fw-bold mt-3">خطأ في التحميل</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

function renderSummary(data, sessionId) {
    if (data.length === 0) {
        document.getElementById('sessionSummary').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <h3 class="fw-bold mt-3">لا توجد تقييمات لهذه الجلسة بعد</h3>
            </div>`;
        return;
    }

    const ratedData = data.filter(f => f.sessionRating > 0);
    const avgRating = ratedData.length ? (ratedData.reduce((s, f) => s + f.sessionRating, 0) / ratedData.length).toFixed(1) : '—';
    const totalResponses = data.length;
    const withFeedback = data.filter(f => f.speakerFeedback && f.speakerFeedback.trim() !== '').length;

    let performance = '', perfColor = '';
    const avgNum = parseFloat(avgRating);
    if (avgNum >= 4.5) { performance = 'ممتاز'; perfColor = 'var(--green)'; }
    else if (avgNum >= 3.5) { performance = 'جيد جداً'; perfColor = 'var(--orange)'; }
    else if (avgNum >= 2.5) { performance = 'جيد'; perfColor = '#FED7AA'; }
    else { performance = 'يحتاج تحسين'; perfColor = '#FECACA'; }

    document.getElementById('sessionSummary').innerHTML = `
        <div class="summary-grid">
            <div class="summary-item big" style="background: ${perfColor};">
                <span class="value">${avgRating}<span style="font-size:1.2rem">/5</span></span>
                <span class="label">التقييم العام (${performance})</span>
            </div>
            <div class="summary-item">
                <span class="value">${totalResponses}</span>
                <span class="label">إجمالي التقييمات</span>
            </div>
            <div class="summary-item">
                <span class="value">${withFeedback}</span>
                <span class="label">ملاحظات نصية</span>
            </div>
        </div>
    `;
}

function renderDetailedRating(data) {
    const ratedData = data.filter(f => f.sessionRating > 0);
    if (ratedData.length === 0) {
        document.getElementById('detailedRating').innerHTML = '<div class="empty-state"><p>لا توجد تقييمات</p></div>';
        return;
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedData.forEach(f => { if (distribution[f.sessionRating] !== undefined) distribution[f.sessionRating]++; });
    const total = ratedData.length;

    document.getElementById('detailedRating').innerHTML = `
        <div class="rating-breakdown">
            ${[5, 4, 3, 2, 1].map(stars => {
                const count = distribution[stars];
                const pct = Math.round((count / total) * 100);
                return `
                <div class="rating-row">
                    <div class="rating-label">
                        ${'<i class="fa-solid fa-star text-warning"></i>'.repeat(stars)}
                    </div>
                    <div class="rating-bar-container">
                        <div class="rating-bar" style="width: ${pct}%">${pct}%</div>
                    </div>
                    <div class="rating-count">${count} تقييم</div>
                </div>
            `}).join('')}
        </div>
    `;
}

function renderFeedbackList(data) {
    const withFeedback = data.filter(f => f.speakerFeedback && f.speakerFeedback.trim() !== '');
    
    if (withFeedback.length === 0) {
        document.getElementById('feedbackList').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-comment-slash"></i>
                <h3 class="fw-bold mt-3">لا توجد ملاحظات نصية</h3>
            </div>`;
        return;
    }

    document.getElementById('feedbackList').innerHTML = withFeedback.map(f => {
        const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '';
        return `
        <div class="feedback-item">
            <div class="feedback-header">
                <div>
                    <span class="feedback-name">${f.name || 'مجهول'}</span>
                    <span class="feedback-role">${f.role || '—'}</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    ${f.sessionRating ? `<span class="feedback-stars">${'<i class="fa-solid fa-star"></i>'.repeat(f.sessionRating)}</span>` : ''}
                    <small class="text-muted">${date}</small>
                </div>
            </div>
            <div class="feedback-text">${f.speakerFeedback}</div>
        </div>
    `}).join('');
}
