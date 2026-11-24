import { renderTemplate } from './email-template.utils';

describe('renderTemplate', () => {
  it('replaces {{$key}} placeholders with their values', () => {
    expect(
      renderTemplate('Hi {{$firstName}}, go to {{$url}}', {
        firstName: 'Ada',
        url: 'https://example.com',
      }),
    ).toBe('Hi Ada, go to https://example.com');
  });

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('Hi {{ $firstName }}', { firstName: 'Ada' })).toBe(
      'Hi Ada',
    );
  });

  it('replaces every occurrence of a placeholder', () => {
    expect(renderTemplate('{{$a}}-{{$a}}', { a: 'x' })).toBe('x-x');
  });

  it('leaves placeholders without a matching variable untouched', () => {
    expect(renderTemplate('Hi {{$missing}}', { other: 'x' })).toBe(
      'Hi {{$missing}}',
    );
  });

  it('does not replace placeholders written without the $ prefix', () => {
    expect(renderTemplate('Hi {{firstName}}', { firstName: 'Ada' })).toBe(
      'Hi {{firstName}}',
    );
  });
});
