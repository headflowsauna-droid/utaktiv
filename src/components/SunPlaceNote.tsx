import React, { useMemo, useState } from 'react';
import { HORIZONS } from '../data/horizons';
import { describePlaceSun } from '../engine/sunPlace';

interface SunPlaceNoteProps {
  sunPointId: string;
  lat: number;
  lng: number;
  viewAzimuthDeg?: number;
  viewLabel?: string;
  cloudCoverPercent?: number;
  cloudIsMeasured?: boolean;
  lang?: 'no' | 'en';
}

export const SunPlaceNote: React.FC<SunPlaceNoteProps> = ({
  sunPointId,
  lat,
  lng,
  viewAzimuthDeg,
  viewLabel,
  cloudCoverPercent,
  cloudIsMeasured,
  lang = 'no',
}) => {
  const [now, setNow] = useState(() => new Date());
  const sentence = useMemo(
    () =>
      describePlaceSun({
        lat,
        lng,
        now,
        horizon: HORIZONS[sunPointId] ?? null,
        viewAzimuthDeg,
        viewLabel,
        cloudCoverPercent,
        cloudIsMeasured,
      }),
    [sunPointId, lat, lng, now, viewAzimuthDeg, viewLabel, cloudCoverPercent, cloudIsMeasured]
  );

  return (
    <div className="mt-3 p-3 rounded-2xl bg-[#FAFAF8] border border-zinc-200 text-xs text-zinc-800 leading-relaxed">
      <div className="font-semibold text-zinc-950 mb-1">
        {lang === 'en' ? 'Sun at this point' : 'Sol på dette punktet'}
      </div>
      <p>{lang === 'en' ? sentence.sentenceEn : sentence.sentenceNo}</p>
      <button
        type="button"
        onClick={() => setNow(new Date())}
        className="mt-2 text-[11px] font-semibold text-[#E8622C] hover:underline"
      >
        {lang === 'en' ? 'Calculate again' : 'Regn ut på nytt'}
      </button>
    </div>
  );
};
