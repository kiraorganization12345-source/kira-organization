import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Compass, Sun, Moon } from 'lucide-react';
import { PrayerTimes } from '../types';

interface PrayerTimesViewProps {
  onBackToSurahs?: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({ onBackToSurahs }) => {
  const [selectedCity, setSelectedCity] = useState<string>('مكة المكرمة');
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);

  const cityCoords: Record<string, { lat: string; lng: string }> = {
    'مكة المكرمة': { lat: '21.4225', lng: '39.8262' },
    'المدينة المنورة': { lat: '24.4672', lng: '39.6111' },
    'الرياض': { lat: '24.7136', lng: '46.6753' },
    'القاهرة': { lat: '30.0444', lng: '31.2357' },
    'دبي': { lat: '25.2048', lng: '55.2708' },
    'إسطنبول': { lat: '41.0082', lng: '28.9784' },
    'لندن': { lat: '51.5074', lng: '-0.1278' }
  };

  useEffect(() => {
    setLoading(true);
    const coords = cityCoords[selectedCity] || cityCoords['مكة المكرمة'];

    fetch(`/api/prayers?lat=${coords.lat}&lng=${coords.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && data.data.timings) {
          const t = data.data.timings;
          setPrayers({
            Fajr: t.Fajr,
            Sunrise: t.Sunrise,
            Dhuhr: t.Dhuhr,
            Asr: t.Asr,
            Maghrib: t.Maghrib,
            Isha: t.Isha,
            dateStr: data.data.date.readable,
            hijriDate: `${data.data.date.hijri.day} ${data.data.date.hijri.month.ar} ${data.data.date.hijri.year}`,
            city: selectedCity
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load prayer times', err);
        setLoading(false);
      });
  }, [selectedCity]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 sm:p-8 rounded-3xl text-stone-100 shadow-xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="space-y-2 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>مواقيت الصلاة حسب التوقيت المحلي</span>
          </div>
          <h2 className="text-3xl font-extrabold font-quran text-amber-100">
            أوقات الصلاة واتجاه القبلة
          </h2>
          {prayers && (
            <p className="text-stone-300 text-xs font-cairo">
              التاريخ الهجري: <span className="font-bold text-amber-300">{prayers.hijriDate}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {/* City Selector */}
          <div className="flex items-center gap-2 bg-stone-800 p-2 rounded-2xl border border-stone-700">
            <MapPin className="w-4 h-4 text-amber-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-100 outline-none cursor-pointer"
            >
              {Object.keys(cityCoords).map(city => (
                <option key={city} value={city} className="bg-stone-900 text-stone-100">
                  {city}
                </option>
              ))}
            </select>
          </div>

          {onBackToSurahs && (
            <button
              onClick={onBackToSurahs}
              className="px-3.5 py-2 rounded-2xl bg-stone-800 hover:bg-amber-600 text-amber-200 hover:text-stone-950 border border-amber-500/30 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <span>← فهرس السور</span>
            </button>
          )}
        </div>

      </div>

      {/* Prayer Times Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-stone-500">جاري حساب مواقيت الصلاة...</p>
        </div>
      ) : prayers && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'الفجر', time: prayers.Fajr, icon: <Moon className="w-5 h-5 text-indigo-400" /> },
            { name: 'الشروق', time: prayers.Sunrise, icon: <Sun className="w-5 h-5 text-amber-400" /> },
            { name: 'الظهر', time: prayers.Dhuhr, icon: <Sun className="w-5 h-5 text-yellow-400" /> },
            { name: 'العصر', time: prayers.Asr, icon: <Sun className="w-5 h-5 text-orange-400" /> },
            { name: 'المغرب', time: prayers.Maghrib, icon: <Moon className="w-5 h-5 text-red-400" /> },
            { name: 'العشاء', time: prayers.Isha, icon: <Moon className="w-5 h-5 text-purple-400" /> }
          ].map((p) => (
            <div
              key={p.name}
              className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm text-center space-y-2 hover:border-amber-500/50 transition-all"
            >
              <div className="mx-auto w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                {p.icon}
              </div>
              <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300 font-quran">{p.name}</h4>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-300 dir-ltr">{p.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Qibla Direction Information Box */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 dark:text-amber-100 font-quran">اتجاه القبلة نحو الكعبة المشرفة</h4>
            <p className="text-xs text-stone-500">مكة المكرمة: خط عرض 21.4225° N، خط طول 39.8262° E</p>
          </div>
        </div>
      </div>

    </div>
  );
};
