import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  MoreVertical,
  Layers,
  Terminal,
  ExternalLink,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: any; // BeforeInstallPromptEvent
  onTriggerInstall: () => Promise<void>;
  isInstalled: boolean;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  installPrompt,
  onTriggerInstall,
  isInstalled
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'apk_capacitor' | 'twa_playstore'>('instant');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  return (
    <div
      id="android-install-modal-overlay"
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="android-install-modal-container"
        className="relative w-full max-w-2xl bg-stone-950 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 text-stone-100 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>تطبيق أندرويد (Android App)</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Android Native & PWA
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                تثبيت وتشغيل تطبيق القرآن الكريم على جميع أجهزة وهواتف أندرويد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-900/60 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'instant'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>التثبيت الفوري المباشر (WebAPK)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk_capacitor')}
            className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'apk_capacitor'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>بناء APK (Capacitor)</span>
          </button>
          <button
            onClick={() => setActiveTab('twa_playstore')}
            className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'twa_playstore'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Google Play (TWA)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Instant PWA/WebAPK Install on Android */}
          {activeTab === 'instant' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-emerald-300">
                    أسهل وأسرع طريقة: تثبيت فوري بدون متجر أو أسلاك
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    يعمل كتطبيق أندرويد أصلي (Standalone APK) يظهر في قائمة التطبيقات والشاشة الرئيسية بهاتفك،
                    مع فتح فوري، وبدون إعلانات، وبدعم شاشات AMOLED والوضع الليلي وتوفير البطارية.
                  </p>
                </div>
              </div>

              {/* Install Action Banner */}
              {isInstalled ? (
                <div className="p-4 rounded-xl bg-stone-900 border border-emerald-500/40 flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">التطبيق مثبت بالفعل على جهازك!</h4>
                    <p className="text-xs text-stone-400">
                      يمكنك العثور على أيقونة «موقع التوبة» في شاشة التطبيقات الرئيسية بهاتفك.
                    </p>
                  </div>
                </div>
              ) : installPrompt ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 via-stone-900 to-stone-900 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">جاهز للتثبيت بضغطة زر</h4>
                      <p className="text-xs text-stone-400">متصفحك يدعم التثبيت الفوري التلقائي</p>
                    </div>
                    <button
                      onClick={onTriggerInstall}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت التطبيق على الهاتف الآن</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    خطوات التثبيت اليدوي على هواتف أندرويد (Chrome / Samsung Internet):
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[11px]">
                          1
                        </span>
                        <span>متصفح جوجل كروم (Chrome)</span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        اضغط على قائمة الثلاث نقاط <MoreVertical className="w-3.5 h-3.5 inline text-amber-400 mx-0.5" /> في أعلى يسار المتصفح، ثم اختر <strong className="text-white">«تثبيت التطبيق»</strong> أو <strong className="text-white">«إضافة إلى الشاشة الرئيسية»</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[11px]">
                          2
                        </span>
                        <span>متصفح سامسونج (Samsung Internet)</span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        اضغط على زر القائمة <MoreVertical className="w-3.5 h-3.5 inline text-amber-400 mx-0.5" /> بالأسفل، ثم اضغط على <strong className="text-white">«إضافة صفحة إلى»</strong> واختيار <strong className="text-white">«شاشة التطبيقات»</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Native Android Features List */}
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-3">
                <h4 className="text-xs font-bold text-stone-300">المزايا المتاحة في تطبيق أندرويد:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تشغيل الصوت بالخلفية وإشعارات القفل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اهتزاز خفيف للمسبحة والآيات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>وضع ملء الشاشة كلياً (Full Screen)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>حفظ محلي للعلامات المرجعية والسمات</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Capacitor Native APK Build */}
          {activeTab === 'apk_capacitor' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-900 border border-amber-500/30 text-xs text-stone-300 leading-relaxed">
                تم تهيئة ملفات <strong className="text-amber-400">Capacitor Android</strong> بالمشروع وتوليد <code className="text-amber-300 bg-stone-950 px-1 py-0.5 rounded">capacitor.config.ts</code> بحزمة <code className="text-amber-300 bg-stone-950 px-1 py-0.5 rounded">com.touba.quran.app</code>.
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white">خطوات بناء حزمة Android APK وفتحه في Android Studio:</h4>

                {/* Step 1 */}
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">1. إضافة منصة أندرويد للمشروع:</span>
                    <button
                      onClick={() => copyToClipboard('npx cap add android', 'step1')}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedCommand === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand === 'step1' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-stone-950 text-amber-300 text-xs font-mono overflow-x-auto" dir="ltr">
                    npx cap add android
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">2. بناء ومزامنة الملفات (Build & Sync):</span>
                    <button
                      onClick={() => copyToClipboard('npm run android:sync', 'step2')}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedCommand === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand === 'step2' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-stone-950 text-amber-300 text-xs font-mono overflow-x-auto" dir="ltr">
                    npm run android:sync
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">3. فتح المشروع في Android Studio لتوليد APK/AAB:</span>
                    <button
                      onClick={() => copyToClipboard('npm run android:open', 'step3')}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedCommand === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand === 'step3' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-stone-950 text-amber-300 text-xs font-mono overflow-x-auto" dir="ltr">
                    npm run android:open
                  </pre>
                  <p className="text-[11px] text-stone-400">
                    داخل أندرويد ستوديو، اضغط على <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Google Play Store TWA */}
          {activeTab === 'twa_playstore' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-900 border border-emerald-500/30 text-xs text-stone-300 leading-relaxed">
                تم تجهيز ملف <code className="text-emerald-300 bg-stone-950 px-1 py-0.5 rounded">twa-manifest.json</code> لنشر تطبيق أندرويد مباشرة على <strong className="text-white">Google Play Store</strong> باستخدام أداة Google الرسمية <strong className="text-emerald-400">Bubblewrap</strong>.
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white">خطوات توليد ملف الـ Android App Bundle (.aab) لمتجر جوجل بلاي:</h4>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">1. تثبيت أداة Bubblewrap من Google:</span>
                    <button
                      onClick={() => copyToClipboard('npm install -g @bubblewrap/cli', 'twa1')}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedCommand === 'twa1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand === 'twa1' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-stone-950 text-emerald-300 text-xs font-mono overflow-x-auto" dir="ltr">
                    npm install -g @bubblewrap/cli
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">2. توليد وبناء حزمة الأندرويد:</span>
                    <button
                      onClick={() => copyToClipboard('bubblewrap build', 'twa2')}
                      className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedCommand === 'twa2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand === 'twa2' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-stone-950 text-emerald-300 text-xs font-mono overflow-x-auto" dir="ltr">
                    bubblewrap build
                  </pre>
                  <p className="text-[11px] text-stone-400">
                    سينتج الملف الموقع جاهزاً لرفعه إلى <strong>Google Play Console</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900/80 border-t border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>متوافق مع جميع إصدارات أندرويد (Android 8.0+)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
