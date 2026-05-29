import SvgIcon from '@mui/material/SvgIcon';

export default function KaraokeIcon(props) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      {/* Capsule / ball grille */}
      <circle cx="12" cy="6" r="4.5" />
      {/* Handle body */}
      <rect x="9.5" y="9.5" width="5" height="10" rx="2.5" />
      {/* Grip lines */}
      <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="9.5" y1="15"   x2="14.5" y2="15"   stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="9.5" y1="17.5" x2="14.5" y2="17.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </SvgIcon>
  );
}
