import SubscribeForm from './SubscribeForm';

export default function SubscribeBand({ source = 'homepage' }: { source?: string }) {
  return (
    <section className="sub-band" id="subscribe">
      <div className="container sub-inner">
        <div className="eyebrow" style={{ justifyContent: 'center' }}>The Weekly Guide</div>
        <h2>Never miss the <em>right night</em> again.</h2>
        <p className="lede" style={{ margin: '20px auto 0' }}>
          Get LA weekend party picks every Friday — top 5 events, best underground,
          best free night, best afterhours. Curated by humans, never spam.
        </p>
        <SubscribeForm source={source} />
        <div className="sub-perks">
          <span>Weekly LA underground guide</span>
          <span>Secret warehouse alerts</span>
          <span>Guest list drops</span>
          <span>New venue openings</span>
        </div>
      </div>
    </section>
  );
}
