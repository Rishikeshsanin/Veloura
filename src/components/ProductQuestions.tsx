import { HelpCircle } from 'lucide-react'
import { categoryLabel } from '../data/catalog'
import type { Product } from '../types'

export default function ProductQuestions({product}:{product:Product}){
  const sizeAnswer=product.sizes?.length
    ? `Available options: ${product.sizes.join(', ')}. Brand-specific sizing can vary.`
    : 'The provider did not supply selectable size options for this catalog item.'
  const stockAnswer=product.stock===0
    ? 'This item is currently marked out of stock.'
    : product.stock!==undefined
      ? product.stock<=15?'The catalog currently shows limited stock.':'The catalog currently shows this item in stock.'
      : 'The provider did not supply a stock count.'
  const sourceAnswer=product.sourceLabel
    ? `This product is currently represented from ${product.sourceLabel}. Veloura keeps the original catalog source visible where available.`
    : 'This item is part of Veloura’s managed multi-source catalog.'

  const items=[
    ['What size information is available?',sizeAnswer],
    ['Is it currently available?',stockAnswer],
    ['What colour is shown?',product.color?`The catalog colour is listed as ${product.color}.`:'The provider did not supply a reliable colour label.'],
    ['What department is this in?',`Veloura classifies this item under ${categoryLabel(product.category)}.`],
    ['Where does the product information come from?',sourceAnswer],
    ['Can I return it?','The storefront represents a sandbox 30-day return policy for eligible items. No real courier return is created while physical fulfilment remains inactive.'],
  ]

  return <section className="product-questions">
    <div className="detail-label"><strong>PRODUCT Q&A</strong><span>Answers from available product data</span></div>
    <div className="product-questions-list">{items.map(([question,answer])=><details key={question}><summary><HelpCircle size={15}/>{question}</summary><p>{answer}</p></details>)}</div>
  </section>
}
