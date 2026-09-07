import React from 'react';

interface SheetProps {
  children: React.ReactNode;
  className?: string;
  /** Draws the inner hairline of a drafting frame */
  framed?: boolean;
  /** Corner registration ticks */
  ticks?: boolean;
  /** Vermilion index tab on the top edge */
  tab?: boolean;
  hover?: boolean;
  shadow?: boolean;
}

/** A sheet of drawing paper: 2px ink border, square corners, optional furniture. */
export const Sheet: React.FC<SheetProps> = ({
  children,
  className = '',
  framed = false,
  ticks = false,
  tab = false,
  hover = false,
  shadow = true,
}) => (
  <div
    className={[
      'sheet',
      framed ? 'sheet-framed' : '',
      ticks ? 'ticks' : '',
      tab ? 'tab-signal' : '',
      hover ? 'sheet-hover' : '',
      shadow ? 'shadow-hard-sm' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);

interface SheetHeadProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Header band of a sheet — title on the left, annotation or controls on the right. */
export const SheetHead: React.FC<SheetHeadProps> = ({ title, icon, meta, actions }) => (
  <div className="panel-head">
    <h2 className="panel-title">
      {icon}
      <span>{title}</span>
    </h2>
    <div className="flex items-center gap-3">
      {meta && <span className="annotation">{meta}</span>}
      {actions}
    </div>
  </div>
);
