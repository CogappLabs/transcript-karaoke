import { alpha, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';

function runningInGecko() {
  return navigator.userAgent.indexOf('Gecko/') >= 0;
}

const PageTextDisplay = forwardRef(
  (
    {
      bgColor,
      height: pageHeight,
      lines,
      opacity,
      pageColors,
      selectable,
      textColor,
      useAutoColors,
      visible,
      width: pageWidth,
    },
    ref,
  ) => {
    const theme = useTheme();
    const containerRef = useRef(null);
    const textContainerRef = useRef(null);
    const boxContainerRef = useRef(null);
    const styleRef = useRef(null);
    const highlightRectRef = useRef(null);
    const ballRef = useRef(null);
    const ballAnimRef = useRef(null);

    useEffect(() => {
      const textContainer = textContainerRef.current;
      if (!textContainer) {
        return undefined;
      }

      const onPointerDown = (event) => {
        if (!selectable) return;
        event.stopPropagation();
      };

      textContainer.addEventListener('pointerdown', onPointerDown);
      textContainer.addEventListener('touchstart', onPointerDown);

      return () => {
        textContainer.removeEventListener('pointerdown', onPointerDown);
        textContainer.removeEventListener('touchstart', onPointerDown);
      };
    }, [selectable]);

    useImperativeHandle(
      ref,
      () => ({
        updateColors(newTextColor, newBgColor, newOpacity) {
          if (!textContainerRef.current || !boxContainerRef.current) return;

          for (const rect of boxContainerRef.current.querySelectorAll('rect')) {
            rect.style.fill = alpha(newBgColor, newOpacity);
          }

          for (const textElement of textContainerRef.current.querySelectorAll('text')) {
            textElement.style.fill = alpha(newTextColor, newOpacity);
          }
        },

        updateSelectability(newSelectable) {
          if (!textContainerRef.current) return;

          const svgElem = textContainerRef.current.parentElement;
          svgElem.style.userSelect = newSelectable ? 'text' : 'none';
          if (styleRef.current) {
            styleRef.current.textContent = getStyleText(theme, newSelectable);
          }
        },

        updateTransforms(scaleFactor, x, y) {
          if (!containerRef.current) return;

          const translateX = ((scaleFactor - 1) * pageWidth) / 2 + x * scaleFactor * -1;
          const translateY = ((scaleFactor - 1) * pageHeight) / 2 + y * scaleFactor * -1;

          containerRef.current.style.display = null;
          containerRef.current.style.transform = [
            `translate(${translateX}px, ${translateY}px)`,
            `scale(${scaleFactor})`,
          ].join(' ');
        },

        highlightWord(box) {
          const rect = highlightRectRef.current;
          if (!rect) return;
          if (!box) {
            rect.style.display = 'none';
            return;
          }
          rect.setAttribute('x', box.x);
          rect.setAttribute('y', box.y);
          rect.setAttribute('width', box.width);
          rect.setAttribute('height', box.height);
          rect.style.display = null;
        },

        moveBallTo(box, fromBox) {
          const ball = ballRef.current;
          if (!ball) return;

          const r = box.height * 0.4;
          const cx2 = box.x + box.width / 2;
          const cy2 = box.y - r - 2;

          ball.setAttribute('r', r);
          ball.setAttribute('cx', cx2);
          ball.setAttribute('cy', cy2);
          ball.style.display = null;

          if (fromBox) {
            const cx1 = fromBox.x + fromBox.width / 2;
            const cy1 = fromBox.y - fromBox.height * 0.4 - 2;
            const dx = cx2 - cx1;
            const dy = cy2 - cy1;
            const bounceHeight = box.height * 2;
            const midX = -dx * 0.5;
            const midY = -dy * 0.5 - bounceHeight;

            ballAnimRef.current?.cancel();
            ballAnimRef.current = ball.animate(
              [
                { transform: `translate(${-dx}px, ${-dy}px)` },
                { transform: `translate(${midX}px, ${midY}px)` },
                { transform: 'translate(0, 0)' },
              ],
              { duration: 300, easing: 'ease-in-out' },
            );
          }
        },

        clearBall() {
          ballAnimRef.current?.cancel();
          ballAnimRef.current = null;
          if (ballRef.current) ballRef.current.style.display = 'none';
        },
      }),
      [pageHeight, pageWidth, theme],
    );

    const containerStyle = {
      display: 'none',
      position: 'absolute',
      willChange: 'transform',
    };
    const svgStyle = {
      height: pageHeight,
      left: 0,
      top: 0,
      userSelect: selectable ? 'text' : 'none',
      whiteSpace: 'pre',
      width: pageWidth,
    };

    let fg = textColor;
    let bg = bgColor;
    if (useAutoColors && pageColors) {
      fg = pageColors.textColor;
      bg = pageColors.bgColor;
    }

    const renderOpacity = !visible && selectable ? 0 : opacity;
    const boxStyle = { fill: alpha(bg, renderOpacity) };
    const textStyle = { fill: alpha(fg, renderOpacity) };
    const renderLines = lines.filter((line) => line.width > 0 && line.height > 0);
    const isGecko = runningInGecko();

    let LineWrapper = ({ children }) => <text style={textStyle}>{children}</text>;
    let SpanElement = (props) => <tspan {...props} />;

    if (isGecko) {
      LineWrapper = React.Fragment;
      SpanElement = (props) => <text style={textStyle} {...props} />;
    }

    return (
      <div ref={containerRef} style={containerStyle}>
        <svg style={{ ...svgStyle, userSelect: 'none' }}>
          <g ref={boxContainerRef}>
            {renderLines.map((line) => (
              <rect
                key={`rect-${line.x}.${line.y}`}
                height={line.height}
                style={boxStyle}
                width={line.width}
                x={line.x}
                y={line.y}
              />
            ))}
          </g>
          <rect
            ref={highlightRectRef}
            rx="3"
            style={{ display: 'none', fill: 'rgba(255, 200, 0, 0.55)', pointerEvents: 'none' }}
          />
        </svg>
        <svg
          className="mirador-textoverlay__text-overlay"
          style={{
            ...svgStyle,
            position: 'absolute',
          }}
        >
          <style ref={styleRef}>{getStyleText(theme, selectable)}</style>
          <circle
            ref={ballRef}
            style={{ display: 'none', fill: '#FFD700', pointerEvents: 'none' }}
          />
          <g ref={textContainerRef}>
            {renderLines.map((line) =>
              line.spans ? (
                <LineWrapper key={`line-${line.x}-${line.y}`}>
                  {line.spans
                    .filter((word) => word.width > 0 && word.height > 0)
                    .map(({ text, width, x, y }) => (
                      <SpanElement
                        key={`text-${x}-${y}`}
                        fontSize={`${line.height * 0.75}px`}
                        lengthAdjust="spacingAndGlyphs"
                        textLength={width}
                        x={x}
                        y={line.y + line.height * 0.75}
                      >
                        {text}
                      </SpanElement>
                    ))}
                </LineWrapper>
              ) : (
                <text
                  key={`line-${line.x}-${line.y}`}
                  fontSize={`${line.height}px`}
                  lengthAdjust="spacingAndGlyphs"
                  style={textStyle}
                  textLength={line.width}
                  x={line.x}
                  y={line.y + line.height * 0.75}
                >
                  {line.text}
                </text>
              ),
            )}
          </g>
        </svg>
      </div>
    );
  },
);

PageTextDisplay.displayName = 'PageTextDisplay';

function getStyleText(theme, selectable) {
  return `.mirador-textoverlay__text-overlay {
    font-family: ${theme?.textOverlay?.overlayFont ?? 'sans-serif'};
  }
  .mirador-textoverlay__text-overlay ::selection {
    fill: ${theme?.textOverlay?.selectionTextColor ?? 'rgba(255, 255, 255, 1)'};
    color: ${theme?.textOverlay?.selectionTextColor ?? 'rgba(255, 255, 255, 1)'};
    background-color: ${theme?.textOverlay?.selectionBackgroundColor ?? 'rgba(0, 55, 255, 1)'};
  }
  ${selectable ? 'text { cursor: text; }' : ''}`;
}

PageTextDisplay.propTypes = {
  bgColor: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
  lines: PropTypes.array.isRequired,
  opacity: PropTypes.number.isRequired,
  pageColors: PropTypes.object,
  selectable: PropTypes.bool.isRequired,
  slotIndex: PropTypes.number.isRequired,
  source: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
  useAutoColors: PropTypes.bool.isRequired,
  visible: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
};

PageTextDisplay.defaultProps = {
  pageColors: undefined,
};

function sameAutoColors(prevPageColors, nextPageColors) {
  if (prevPageColors === nextPageColors) {
    return true;
  }

  return (
    prevPageColors?.textColor === nextPageColors?.textColor &&
    prevPageColors?.bgColor === nextPageColors?.bgColor
  );
}

function sameProps(prevProps, nextProps) {
  return (
    prevProps.source === nextProps.source &&
    prevProps.lines === nextProps.lines &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.opacity === nextProps.opacity &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.slotIndex === nextProps.slotIndex &&
    prevProps.visible === nextProps.visible &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.bgColor === nextProps.bgColor &&
    prevProps.useAutoColors === nextProps.useAutoColors &&
    sameAutoColors(prevProps.pageColors, nextProps.pageColors)
  );
}

export default memo(PageTextDisplay, sameProps);
