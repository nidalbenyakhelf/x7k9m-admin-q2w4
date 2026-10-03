import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ✅ بيانات مشروعك الحقيقية
const firebaseConfig = {
  apiKey: "AIzaSyC5UjzMRr9BOBtuBIbI6sThWtv3BI0HPzo",
  authDomain: "feedbacksoftskils.firebaseapp.com",
  projectId: "feedbacksoftskils",
  storageBucket: "feedbacksoftskils.firebasestorage.app",
  messagingSenderId: "347396669754",
  appId: "1:347396669754:web:54344c7c874b7cdb11d003"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // هذا هو المتغير الذي سنستخدمه للحفظ والقراءة

const ADMIN_PASSWORD = "skills2026"; // ⚠️ غيّرها!
let allFeedbackData = [];

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

function checkSavedLogin() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') showAdminPanel();
}

document.getElementById('loginBtn').addEventListener('click', () => {
    const input = document.getElementById('adminPassword').value;
    if (input === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'كلمة مرور خاطئة',
            text: 'الرجاء إدخال كلمة المرور الصحيحة',
            confirmButtonColor: '#FECACA',
            customClass: { popup: 'swal-custom-popup' }
        });
    }
});

document.getElementById('adminPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
});

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAllData();
}

async function loadAllData() {
    try {
        Swal.fire({
            title: 'جاري التحميل...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'swal-custom-popup' }
        });

        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allFeedbackData = [];
        querySnapshot.forEach((d) => {
            allFeedbackData.push({ id: d.id, ...d.data() });
        });

        Swal.close();
        renderAll();
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ في التحميل',
            text: error.message,
            confirmButtonColor: '#FECACA'
        });
    }
}

function renderAll() {
    renderExecutiveSummary();
    renderStats();
    renderNPS();
    renderSessions();
    renderFeedbackList(allFeedbackData);
}

function renderExecutiveSummary() {
    const data = allFeedbackData;
    if (data.length === 0) {
        document.getElementById('executiveSummary').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <h4 class="fw-bold mt-3">لا توجد بيانات بعد</h4>
            </div>`;
        return;
    }

    const avgNPS = (data.reduce((s, f) => s + (f.npsRating || 0), 0) / data.length).toFixed(1);
    const avgSession = data.filter(f => f.sessionRating > 0);
    const avgSessionVal = avgSession.length ? (avgSession.reduce((s, f) => s + f.sessionRating, 0) / avgSession.length).toFixed(1) : '—';
    const avgLogistics = data.filter(f => f.logisticsRating > 0);
    const avgLogVal = avgLogistics.length ? (avgLogistics.reduce((s, f) => s + f.logisticsRating, 0) / avgLogistics.length).toFixed(1) : '—';

    const promoters = data.filter(f => f.npsRating >= 9).length;
    const detractors = data.filter(f => f.npsRating <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / data.length) * 100);

    let npsVerdict = '', verdictClass = '';
    if (npsScore >= 50) { npsVerdict = 'ممتاز'; verdictClass = 'highlight'; }
    else if (npsScore >= 0) { npsVerdict = 'جيد'; verdictClass = ''; }
    else { npsVerdict = 'يحتاج تحسين'; verdictClass = 'warning'; }

    document.getElementById('executiveSummary').innerHTML = `
        <div class="exec-summary-grid">
            <div class="exec-item">
                <span class="value">${data.length}</span>
                <span class="label">إجمالي المشاركين</span>
            </div>
            <div class="exec-item ${verdictClass}">
                <span class="value">${npsScore > 0 ? '+' : ''}${npsScore}</span>
                <span class="label">NPS Score (${npsVerdict})</span>
            </div>
            <div class="exec-item">
                <span class="value">${avgNPS}<span style="font-size:1rem">/10</span></span>
                <span class="label">متوسط التوصية</span>
            </div>
            <div class="exec-item">
                <span class="value">${avgSessionVal}<span style="font-size:1rem">/5</span></span>
                <span class="label">تقييم الجلسات</span>
            </div>
            <div class="exec-item">
                <span class="value">${avgLogVal}<span style="font-size:1rem">/5</span></span>
                <span class="label">التنظيم</span>
            </div>
        </div>
    `;
}

function renderStats() {
    const data = allFeedbackData;
    if (data.length === 0) {
        document.getElementById('statsGrid').innerHTML = '';
        return;
    }

    const avgNPS = (data.reduce((s, f) => s + (f.npsRating || 0), 0) / data.length).toFixed(1);
    const sessionData = data.filter(f => f.sessionRating > 0);
    const avgSession = sessionData.length ? (sessionData.reduce((s, f) => s + f.sessionRating, 0) / sessionData.length).toFixed(1) : '—';
    const logData = data.filter(f => f.logisticsRating > 0);
    const avgLogistics = logData.length ? (logData.reduce((s, f) => s + f.logisticsRating, 0) / logData.length).toFixed(1) : '—';
    
    const promoters = data.filter(f => f.npsRating >= 9).length;
    const detractors = data.filter(f => f.npsRating <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / data.length) * 100);

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <span class="number">${data.length}</span>
            <span class="label">إجمالي الردود</span>
        </div>
        <div class="stat-card">
            <span class="number">${npsScore > 0 ? '+' : ''}${npsScore}</span>
            <span class="label">NPS Score</span>
        </div>
        <div class="stat-card">
            <span class="number">${avgSession} <i class="fa-solid fa-star text-warning" style="font-size:1.3rem"></i></span>
            <span class="label">الجلسات</span>
        </div>
        <div class="stat-card">
            <span class="number">${avgLogistics} <i class="fa-solid fa-star text-warning" style="font-size:1.3rem"></i></span>
            <span class="label">التنظيم</span>
        </div>
    `;
}

function renderNPS() {
    const data = allFeedbackData;
    if (data.length === 0) {
        document.getElementById('npsChart').innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-pie"></i><p>لا توجد بيانات</p></div>';
        return;
    }

    const promoters = data.filter(f => f.npsRating >= 9).length;
    const passives = data.filter(f => f.npsRating >= 7 && f.npsRating <= 8).length;
    const detractors = data.filter(f => f.npsRating <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / data.length) * 100);
    const avgNPS = (data.reduce((s, f) => s + (f.npsRating || 0), 0) / data.length).toFixed(1);

    const pPct = Math.round((promoters / data.length) * 100);
    const paPct = Math.round((passives / data.length) * 100);
    const dPct = 100 - pPct - paPct;

    const gradient = `conic-gradient(
        #A7F3D0 0% ${pPct}%, 
        #FED7AA ${pPct}% ${pPct + paPct}%, 
        #FECACA ${pPct + paPct}% 100%
    )`;

    let verdict = '', color = '';
    if (npsScore >= 50) { verdict = 'ممتاز'; color = '#059669'; }
    else if (npsScore >= 0) { verdict = 'جيد'; color = '#D97706'; }
    else { verdict = 'يحتاج تحسين'; color = '#DC2626'; }

    document.getElementById('npsChart').innerHTML = `
        <div class="nps-donut-container">
            <div class="nps-donut" style="background: ${gradient};">
                <div class="nps-donut-center">
                    <span class="score" style="color: ${color}">${npsScore > 0 ? '+' : ''}${npsScore}</span>
                    <span class="label">${verdict}</span>
                </div>
            </div>
            <div class="nps-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #A7F3D0;"></div>
                    <span>المروّجون (9-10): ${promoters} (${pPct}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FED7AA;"></div>
                    <span>المحايدون (7-8): ${passives} (${paPct}%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FECACA;"></div>
                    <span>المعارضون (0-6): ${detractors} (${dPct}%)</span>
                </div>
                <div class="legend-item" style="background: var(--orange);">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>المتوسط: ${avgNPS} من 10</span>
                </div>
            </div>
        </div>
    `;
}

function renderSessions() {
    const data = allFeedbackData;
    const sessions = Object.keys(SESSION_NAMES);
    
    let html = '';
    sessions.forEach(sessionKey => {
        const sessionData = data.filter(f => f.sessionName === sessionKey);
        if (sessionData.length === 0) return;

        const avgRating = sessionData.filter(f => f.sessionRating > 0);
        const avgVal = avgRating.length ? (avgRating.reduce((s, f) => s + f.sessionRating, 0) / avgRating.length).toFixed(1) : '—';
        const totalResponses = sessionData.length;

        const speakerUrl = `/feedbackSpaker/?id=${sessionKey}`;

        html += `
            <div class="session-card">
                <div class="session-info">
                    <h4><i class="fa-solid fa-chalkboard-user me-2"></i> ${SESSION_NAMES[sessionKey]}</h4>
                    <small class="text-muted">${totalResponses} تقييم</small>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <span class="val">${avgVal}<span style="font-size:0.9rem">/5</span></span>
                        <span class="lbl">التقييم</span>
                    </div>
                    <div class="session-stat">
                        <span class="val">${totalResponses}</span>
                        <span class="lbl">استجابة</span>
                    </div>
                </div>
                <div class="session-actions">
                    <button class="action-btn btn-export" onclick="window.open('${speakerUrl}', '_blank')">
                        <i class="fa-solid fa-share-nodes me-2"></i> مشاركة
                    </button>
                </div>
            </div>
        `;
    });

    document.getElementById('sessionsResults').innerHTML = html || '<div class="empty-state"><p>لا توجد تقييمات للجلسات بعد</p></div>';
}

function renderFeedbackList(data) {
    if (data.length === 0) {
        document.getElementById('feedbackList').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <h3 class="fw-bold mt-3">لا توجد نتائج</h3>
            </div>`;
        return;
    }

    document.getElementById('feedbackList').innerHTML = `
        <div class="feedback-accordion">
            ${data.map(f => {
                const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleString('ar-EG') : '—';
                return `
                <div class="feedback-item">
                    <div class="feedback-header" onclick="this.parentElement.classList.toggle('open')">
                        <div class="feedback-meta">
                            <span class="feedback-name">${f.name || 'مجهول'}</span>
                            <span class="feedback-role">${f.role || '—'}</span>
                            <span class="feedback-date"><i class="fa-regular fa-clock me-1"></i> ${date}</span>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="nps-badge">NPS: ${f.npsRating}/10</span>
                            <i class="fa-solid fa-chevron-down toggle-icon"></i>
                        </div>
                    </div>
                    <div class="feedback-body">
                        ${f.sessionName ? `
                            <div class="feedback-section" style="background: var(--purple);">
                                <strong><i class="fa-solid fa-chalkboard-user me-2"></i> الجلسة: ${SESSION_NAMES[f.sessionName] || f.sessionName}</strong>
                                ${f.sessionRating ? `<div class="mb-2 text-warning">${'<i class="fa-solid fa-star"></i>'.repeat(f.sessionRating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - f.sessionRating)}</div>` : ''}
                                ${f.speakerFeedback ? `<p>${f.speakerFeedback}</p>` : ''}
                            </div>
                        ` : ''}
                        ${f.logisticsRating ? `<div class="feedback-section"><strong><i class="fa-solid fa-gears me-2"></i> التنظيم:</strong> <span class="text-warning">${'<i class="fa-solid fa-star"></i>'.repeat(f.logisticsRating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - f.logisticsRating)}</span></div>` : ''}
                        ${f.strengths ? `<div class="feedback-section"><strong><i class="fa-solid fa-circle-check me-2"></i> نقاط القوة:</strong><p>${f.strengths}</p></div>` : ''}
                        ${f.weaknesses ? `<div class="feedback-section"><strong><i class="fa-solid fa-triangle-exclamation me-2"></i> نقاط الضعف:</strong><p>${f.weaknesses}</p></div>` : ''}
                        ${f.suggestions ? `<div class="feedback-section"><strong><i class="fa-solid fa-gem me-2"></i> اقتراحات:</strong><p>${f.suggestions}</p></div>` : ''}
                        ${f.messageToSpeakers ? `<div class="feedback-section" style="background: #EFF6FF;"><strong><i class="fa-solid fa-chalkboard-user me-2"></i> رسالة للأساتذة:</strong><p>${f.messageToSpeakers}</p></div>` : ''}
                        ${f.messageToOrganizers ? `<div class="feedback-section" style="background: #F0FDF4;"><strong><i class="fa-solid fa-users-gear me-2"></i> رسالة للتنظيم:</strong><p>${f.messageToOrganizers}</p></div>` : ''}
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterRole').addEventListener('change', applyFilters);
document.getElementById('filterSession').addEventListener('change', applyFilters);

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('filterRole').value;
    const session = document.getElementById('filterSession').value;

    const filtered = allFeedbackData.filter(f => {
        const matchSearch = !search || 
            (f.name && f.name.toLowerCase().includes(search)) ||
            (f.strengths && f.strengths.toLowerCase().includes(search)) ||
            (f.weaknesses && f.weaknesses.toLowerCase().includes(search)) ||
            (f.messageToSpeakers && f.messageToSpeakers.toLowerCase().includes(search)) ||
            (f.messageToOrganizers && f.messageToOrganizers.toLowerCase().includes(search));
        const matchRole = !role || f.role === role;
        const matchSession = !session || f.sessionName === session;
        return matchSearch && matchRole && matchSession;
    });

    renderFeedbackList(filtered);
}

document.getElementById('exportJsonBtn').addEventListener('click', async () => {
    try {
        const blob = new Blob([JSON.stringify(allFeedbackData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Swal.fire({ icon: 'success', title: 'تم التصدير', timer: 1500, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'خطأ', text: error.message });
    }
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
    let csv = '\uFEFF';
    csv += 'التاريخ,الاسم,الصفة,NPS,الجلسة,تقييم الجلسة,ملاحظات المتحدث,التنظيم,نقاط القوة,نقاط الضعف,اقتراحات,رسالة للأساتذة,رسالة للتنظيم\n';
    allFeedbackData.forEach(f => {
        const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleString('ar-EG') : '';
        const esc = (v) => `"${(v || '').toString().replace(/"/g, '""')}"`;
        csv += `${esc(date)},${esc(f.name)},${esc(f.role)},${f.npsRating || 0},${esc(SESSION_NAMES[f.sessionName] || '')},${f.sessionRating || 0},${esc(f.speakerFeedback)},${f.logisticsRating || 0},${esc(f.strengths)},${esc(f.weaknesses)},${esc(f.suggestions)},${esc(f.messageToSpeakers)},${esc(f.messageToOrganizers)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire({ icon: 'success', title: 'تم تصدير CSV', timer: 1500, showConfirmButton: false });
});

document.getElementById('clearDataBtn').addEventListener('click', async () => {
    const result = await Swal.fire({
        icon: 'warning',
        title: 'تحذير!',
        text: 'سيتم حذف جميع البيانات نهائياً. هل أنت متأكد؟',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#FECACA',
        customClass: { popup: 'swal-custom-popup' }
    });

    if (!result.isConfirmed) return;

    const confirm2 = await Swal.fire({
        icon: 'warning',
        title: 'تأكيد نهائي',
        text: 'هذا الإجراء لا يمكن التراجع عنه!',
        showCancelButton: true,
        confirmButtonText: 'نعم بالتأكيد',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#DC2626'
    });

    if (!confirm2.isConfirmed) return;

    try {
        Swal.fire({ title: 'جاري الحذف...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const q = query(collection(db, "feedback"));
        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map(d => deleteDoc(doc(db, "feedback", d.id)));
        await Promise.all(promises);
        Swal.fire({ icon: 'success', title: 'تم الحذف', timer: 1500, showConfirmButton: false });
        allFeedbackData = [];
        renderAll();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'خطأ', text: error.message });
    }
});

document.getElementById('refreshBtn').addEventListener('click', loadAllData);

checkSavedLogin();