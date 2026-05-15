interface Props {
  quote: string
  attribution: string
}

export function ClosingQuote({ quote, attribution }: Props) {
  return (
    <figure className="closing-quote" aria-label={`Quote by ${attribution}`}>
      <span className="closing-quote__mark closing-quote__mark--open" aria-hidden>
        &ldquo;
      </span>
      <blockquote className="closing-quote__text">
        <p>{quote}</p>
      </blockquote>
      <span className="closing-quote__mark closing-quote__mark--close" aria-hidden>
        &rdquo;
      </span>
      <figcaption className="closing-quote__attr">&mdash; {attribution}</figcaption>
    </figure>
  )
}
