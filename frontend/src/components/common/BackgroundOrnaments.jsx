// Decorative layers from the legacy UI; independent of feature data and API state.
export default function BackgroundOrnaments({ variant = 'default' }) {
  return <div className="sc-background-ornaments" data-background={variant} aria-hidden="true">
    <span className="sc-background-glow sc-background-glow--gold" />
    <span className="sc-background-glow sc-background-glow--champagne" />
  </div>
}
