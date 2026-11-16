// Original Patterna demonstration wording and examples; not a platform import.
export function ConcatenationDescription() {
  return (
    <section className="problem-description" aria-label="Task description">
      <p>
        Given an integer array <code>nums</code> with <code>n</code> elements,
        create a new array containing two consecutive copies of{" "}
        <code>nums</code>.
      </p>
      <p>
        Return the combined array. Keep the elements in the same order in each
        copy, so the result has <code>2 × n</code> elements.
      </p>

      <h2>Example 1</h2>
      <div className="problem-example">
        <pre>
          <span>Input:</span>
          {" nums = [4, 7]\n"}
          <span>Output:</span>
          {" [4, 7, 4, 7]"}
        </pre>
        <p>
          The original pair appears once, followed immediately by the same pair.
        </p>
      </div>

      <h2>Example 2</h2>
      <div className="problem-example">
        <pre>
          <span>Input:</span>
          {" nums = [5, 1, 3]\n"}
          <span>Output:</span>
          {" [5, 1, 3, 5, 1, 3]"}
        </pre>
        <p>
          Each copy preserves the order: <code>5</code>, <code>1</code>, then{" "}
          <code>3</code>.
        </p>
      </div>

      <h2>Requirements</h2>
      <ul>
        <li>
          The result contains exactly <code>2 × n</code> elements.
        </li>
        <li>
          Its first <code>n</code> elements match <code>nums</code>.
        </li>
        <li>
          Its final <code>n</code> elements also match <code>nums</code>.
        </li>
        <li>
          Repeated values in the input must remain repeated in both copies.
        </li>
      </ul>

      <h2>Constraints</h2>
      <ul aria-label="Constraints">
        <li>
          <code>n == nums.length</code>
        </li>
        <li>
          <code>{"1 <= n <= 1000"}</code>
        </li>
        <li>
          <code>{"1 <= nums[i] <= 1000"}</code>
        </li>
      </ul>
    </section>
  );
}
