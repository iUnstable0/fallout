| title | Style Demo |
| description | Showcase of all markdown elements |
| unlisted | true |
| --- | --- |

# Heading 1

This is a paragraph under a level-one heading. It demonstrates the base text styling, line height, and spacing between elements. Here is some **bold text** and some _italic text_ for reference.

## Heading 2

Another paragraph here. You can include [links to other pages](/docs) inline. Links have a subtle hover effect — try hovering over one.

### Heading 3

Content under a level-three heading. These don't have underlines, just spacing.

#### Heading 4

The smallest heading level we style. Still semibold, still clear.

---

## Line Height & Paragraph Spacing

When you're building a hardware project for the first time, everything feels overwhelming. You're staring at a schematic you barely understand, surrounded by components you've never touched, wondering if you'll ever get that LED to blink. But here's the thing — every single person who's built something amazing started exactly where you are right now. The difference isn't talent, it's persistence. Keep showing up, keep soldering, keep debugging, and one day you'll look back and wonder why you were ever scared.

That was a long paragraph to showcase line height. Notice how the lines are spaced apart enough to read comfortably without feeling too spread out. Now here's a second paragraph — check the gap between this and the one above. That's the paragraph spacing at work.

And a third paragraph, because spacing is best demonstrated with at least three blocks of text in a row. The rhythm between paragraphs should feel consistent and natural, giving your eyes a clear break between ideas without creating too much empty space.

## Text Formatting

This is a regular paragraph with **bold text**, _italic text_, and `inline code`. You can also use ~~strikethrough~~ and <small>small text for fine print or annotations</small>.

## Links

- [Internal link to docs home](/docs)
- [External link to Hack Club](https://hackclub.com)

## Lists

### Unordered List

- First item
- Second item with more detail
  - Nested item one
  - Nested item two
- Third item

### Ordered List

1. Step one
2. Step two
   1. Sub-step A
   2. Sub-step B
3. Step three

### Dos and Don'ts

- [x] Do write detailed journal entries about your progress
- [x] Do track your time with Lapse or OBS
- [x] Do ask for help when you're stuck
- [ ] Don't use AI to write your journals
- [ ] Don't copy someone else's project
- [ ] Don't submit without checking the requirements

## Blockquote

> This is a blockquote. It's styled with a left border, subtle background, and italic text. Great for callouts or quotes from people.

## Code

Inline code looks like `this`. Here's a fenced code block:

```ruby
class Project < ApplicationRecord
  has_many :journals
  belongs_to :user

  def total_hours
    journals.sum(:hours)
  end
end
```

## Table

| Feature    | Status    | Priority |
| :--------- | :-------- | :------- |
| Timelapses | Shipped   | High     |
| Journals   | Shipped   | High     |
| Koi Shop   | In review | Medium   |
| Zine Pages | Planned   | Low      |

## Images

Images are capped at a max size and have rounded corners.

## Horizontal Rule

Content above the rule.

---

Content below the rule.

## Callouts

<aside class="callout callout-info">

**Info:** This is an informational callout. Use it for tips, notes, or helpful context.

</aside>

<aside class="callout callout-success">

**Success:** Something went well! Use this for confirmation messages or positive notes.

</aside>

<aside class="callout callout-alert">

**Alert:** Heads up — this is a warning that needs attention but isn't critical.

</aside>

<aside class="callout callout-danger">

**Danger:** This is a critical warning. Something is broken or requires immediate action.

</aside>

## Footnotes

Here's a sentence with a footnote[^1] and another one[^2].

[^1]: This is the first footnote.

[^2]: This is the second footnote with more detail.
