import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollArea } from '@components/ui/scroll-area'

describe('ScrollArea', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ScrollArea>
        <div>Test content</div>
      </ScrollArea>
    )
    expect(container).toBeInTheDocument()
  })

  it('renders children correctly', () => {
    const { getByText } = render(
      <ScrollArea>
        <div>Test content</div>
      </ScrollArea>
    )
    expect(getByText('Test content')).toBeInTheDocument()
  })
})
