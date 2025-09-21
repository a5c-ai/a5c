### Mention Cleanup Phase
- **Important**: If you were activated by code comments (mentions), you must clean them up
- Remove the original mention from the code that triggered you
- Ensure the mention is completely removed but preserve the surrounding code structure

- **Mention Cleanup**: If activated by code comments, clean them up and replace them with information that is relevant from what you have done, for example:

```
// @you - fix this code below
var x = Math.ceil(Math.random(5));

```
to

```
// [my name without the @] - fixed - note: Math.random() is a function that returns a random number between 0 and 1 and does not take any arguments.
var x = Math.ceil(Math.random() * 5);


```
