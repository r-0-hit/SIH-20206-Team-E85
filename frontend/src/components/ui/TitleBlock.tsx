import React from 'react';

interface TitleBlockProps {
  sheetNo: string;
  view: string;
  status?: string;
}

/** The engineering title block that closes every drawing sheet. */
export const TitleBlock: React.FC<TitleBlockProps> = ({ sheetNo, view, status = 'ISSUED' }) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="title-block mt-8">
      <span>
        PROJECT: <strong>PYROGUARD AI</strong>
      </span>
      <span className="hidden sm:inline text-ink/25">|</span>
      <span>
        SHEET NO: <strong>{sheetNo}</strong>
      </span>
      <span className="hidden sm:inline text-ink/25">|</span>
      <span>
        VIEW: <strong>{view}</strong>
      </span>
      <span className="hidden md:inline text-ink/25">|</span>
      <span className="hidden md:inline">
        DATE: <strong>{today}</strong>
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 bg-risk-low" />
        <strong>{status}</strong>
      </span>
    </div>
  );
};
