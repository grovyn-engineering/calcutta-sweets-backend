'use client';

import { Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';

type BodyCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children?: React.ReactNode;
};

/**
 * Drop-in antd Table `components.body.cell`: shows {@link Tooltip} when cell content overflows.
 */
export function AntTableBodyCell(props: BodyCellProps) {
  const { children, className, style, ...rest } = props;
  const ref = useRef<HTMLTableCellElement>(null);
  const [tip, setTip] = useState<string>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const text = el.innerText?.replace(/\s+/g, ' ').trim();
      if (!text) {
        setTip(undefined);
        return;
      }
      const over =
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight > el.clientHeight + 1;
      setTip(over ? text : undefined);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <Tooltip title={tip} placement="topLeft" mouseEnterDelay={0.35} destroyOnHidden>
      <td ref={ref} className={className} style={style} {...rest}>
        {children}
      </td>
    </Tooltip>
  );
}

export const antTableOverflowComponents = {
  body: {
    cell: AntTableBodyCell,
  },
};
