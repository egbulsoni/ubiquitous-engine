"use strict";
function tokenizer(input) {
  // A `current` variable for tracking our position in the code like a cursor.
  let current = 0;

  // And a `tokens` array for pushing our tokens to.
  let tokens = [];

  while (current < input.length) {
    let char = input[current];

    if (char === "(") {
      // If we have an open parenthesis, we push a new token with type `paren` and set the value
      // to an open parenthesis.

      tokens.push({
        type: "paren",
        value: "(",
      });

      // increment current
      current++;

      // and continue onto the next cycle of the loop
      continue;
    }

    // Next we're going to check for a closing parenthesis. We do the same exact
    // thing as before: Check for a closing parenthesis, add a new token,
    // increment `current` and `continue`;
    if (char == ")") {
      tokens.push({
        type: "paren",
        value: ")",
      });
      current++;
      continue;
    }

    // test for whitespace existance and `continue` if it exists
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // The next type of token is a number. This is different than what we have
    // seen before because a number could be any nymber of characters and we want
    // to capture the entire sequence of characters as one token.
    //
    // (add 123 456)
    //      ^^^ ^^^
    //     Only two separate tokens
    //
    // So we start this off when we encounter the first number in a sequence.

    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      // We're going to create a `value` string that we are going to push
      // characters to.
      let value = "";

      // Then we're going to loop through each character in sequence until
      // we encounter a character that is not a number, pushing each character
      // that is a number to our `value` and incrementing `current` as we go.
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: "number", value });

      // And we continue on.
      continue;
    }

    // string support ex: "foo" "bar"
    // We'll start by checking for the opening quote:
    if (char === '"') {
      // keep a `value` variable for building up our string token.
      let value = "";

      // We'll skip the opening double quote in our token.
      char = input[++current];

      // then we'll iterate through each character until we reach another
      // double quote
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // skip the closing double quote
      char = input[++current];

      // and add our `string` token to the `tokens` array.
      tokens.push({ type: "string", value });

      continue;
    }

    // The last type of token will be a `name` token. This is a sequence of
    // letters instead of numbers, that are the same of functions in our lisp syntax.
    //
    //    (add 2 4)
    //     ^^^
    //     Name token
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = "";

      // Again we're just going to loop through all the letters pushing them to
      // a value.

      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // and pushing that value as a token with the type `name` and continuing.
      tokens.push({ type: "name", value });
      continue;
    }

    // Finally if we have not matched a character by now, we're going to throw
    // an error and completely exit.
    throw new TypeError("I dont know what this character is: " + char);
  }

  // Then at the end of our `tokenizer` we simply return the tokens array.
  return tokens;
}

// ================================PARSER====================================
// Function: take an array of tokens and turn it into an AST
// Okay, so we define a `
function parser(tokens) {
  // Again we keep a `current` variable that we will use as a cursor.
  let current = 0;

  // But this time we're going to use recursion instead of a while loop.
  // So we define a `walk` function.

  function walk() {
    // inside the walk function we start by grabbing the `current` token.
    let token = tokens[current];

    // We're going to split each type of token off into a different code path,
    // starting off with `number` tokens.
    //
    // We test to see if we have a `number` token.
    if (token.type === "number") {
      // If we have one, we'll increment `current`
      current++;

      // And we'll return a new AST node called `NumberLiteral` and setting its
      // value to the value of our token.
      return {
        type: "NumberLiteral",
        value: token.value,
      };
    }

    // If we have a string we will do the same as number and create a
    // `StringLiteral` node.
    if (token.type === "string") {
      current++;

      return {
        type: "StringLiteral",
        value: token.value,
      };
    }

    // Next we're going to look for CallExpressions. We start this off when we
    // encounter an open parenthesis

    if (token.type === "paren" && token.value === "(") {
      // We'll increment `current` to skip the parenthesis since we don't care
      // about it in our AST.
      token = tokens[++current];

      // We create a base node with the type `CallExpression`, and we're going
      // to set the name as the current token's value since the next token after
      // the open parenthesis is the name of the function.

      let node = {
        type: "CallExpression",
        name: token.value,
        params: [],
      };

      // We increment `current` *again* to skip the name token.
      token = tokens[++current];

      while (
        token.type !== "paren" ||
        (token.type === "paren" && token.value !== ")")
      ) {
        // we'll call the `walk` function which will return a `node` and we'll
        // push it into our `node.params`.
        node.params.push(walk());
        token = tokens[current];
      }
      // Finally we will increment `current` one last time to skip the closing parenthesis

      current++;
      return node;
    }
    // Again, if we haven't recognized the token type by now we're going to
    // throw an error.
    throw new TypeError(token.type);
  }

  // Now, we're going to create our AST which will have a root which is a
  // `Program` node.
  let ast = {
    type: "Program",
    body: [],
  };

  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // At the end of our parser we'll return the AST
  return ast;
}

//=================================THE TRAVERSER======================================

// So we define a traverser function which accepts an AST and a
// Visitor. Inside we're going to define two functions

function traverser(ast, visitor) {
  // A `traverseArray` function that will allow us to iterate over an array and
  // call the next function that we will define: `traverseNode`.
  function traverseArray(array, parent) {
    array.forEach((child) => {
      traverseNode(child, parent);
    });
  }

  // traverseNode will accept a `node` and its `parent` node. So
  // that it can pass both to our visitor methods.
  function traverseNode(node, parent) {
    // We start by testing for the existence of a method on the visitor with a
    // matching `type`

    let methods = visitor[node.type];

    // If there is an `enter` method for this node type we'll call it with the
    // `node` and its `parent`
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // Next we are going to split things up by the current node type.

    switch (node.type) {
      case "Program":
        traverseArray(node.body, node);
        break;

      // Next we do the same with `CallExpression` and traverse their `params`.
      case "CallExpression":
        traverseArray(node.params, node);
        break;

      case "NumberLiteral":
      case "StringLiteral":
        break;

      // And again, if we haven't recognized the node type then we'll throw an error.
      default:
        throw new TypeError(node.type);
    }

    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // Finally we kickstart the traverser by calling `traverseNode` with our ast
  // with no `parent` because the top level of the AST doesn't have a parent.
  traverseNode(ast, null);
}

//=================================TRANSFORMER=====================================
function transformer(ast) {
  // We'll create a `newAst` which like our previous AST will have a program node

  let newAst = {
    type: "Program",
    body: [],
  };

  // next I'm going to cheat a little and create a bit of a hack. We're going to
  // use a property named `context` on our parent nodes that we're going to push
  // nodes to their parent's `context`. Normally you would have a better abstraction tha this,
  // but for our purposes this keeps things simple.
  //
  // Just take note that the context is a reference *from* the old ast *to* the new ast
  ast._context = newAst.body;

  traverser(ast, {
    // first visitor method accepts any `NumberLiteral`
    NumberLiteral: {
      // We'll visit them on enter.
      enter(node, parent) {
        // We'll create a new node also named `NumberLiteral` that we will push to the parent context.
        parent._context.push({
          type: "NumberLiteral",
          value: node.value,
        });
      },
    },

    // next we have `StringLiteral`
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "StringLiteral",
          value: node.value,
        });
      },
    },

    CallExpression: {
      enter(node, parent) {
        // We start creating a new node `CallExpression` with a nested
        // `Identifier`

        let expression = {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: node.name,
          },
          arguments: [],
        };

        node._context = expression.arguments;

        // Then we're going to check if the parent node is a `CallExpression`.
        // If it is not
        if (parent.type !== "CallExpression") {
          expression = {
            type: "ExpressionStatement",
            expression: expression,
          };
        }

        // Last, we push our (possibly wrapped) `CallExpression` to the `parents context
        parent._context.push(expression);
      },
    },
  });
  return newAst;
}

//=================================The code Generator====================================

function codeGenerator(node) {
  switch (node.type) {
    // If we have a `Program` node. We will map through each node in the `body`
    // and run them through the code generator and join them with a newline.
    case "Program":
      return node.body.map(codeGenerator).join("\n");

    // For `ExpressionStatement` we'll call the code generator on the nested
    // expression and we'll add a semicolon...

    case "ExpressionStatement":
      return (
        codeGenerator(node.expression) + ";" // << (...because we like to code the *correct* way)
      );

    // For `CallExpression` we will print the `callee`, add an open
    // parenthesis, we'll map through each node in the `arguments` array and run them
    // through the code generator, joining them with a comma, and then
    // we'll add a closing parenthesis.

    case "CallExpression":
      return (
        codeGenerator(node.callee) +
        "(" +
        node.arguments.map(codeGenerator).join(", ") +
        ")"
      );

    // For `Identifier`we'll just return the `node`'s name.
    case "Identifier":
      return node.name;

    // For `NumberLiteral` we'll just return the `node`'s value.
    case "NumberLiteral":
      return node.value;

    // For `StringLiteral` we'll add quotations around the `node`'s value.
    case "StringLiteral":
      return '"' + node.value + '"';

    // and if we haven't recognized the node, we'll throw an error.

    default:
      throw new TypeError(node.type);
  }
}

//======================================THE COMPILER===============================

/**
 * FINALLY! We'll create our `'compiler` function. Here we will link together
 * every part of the pipeline.
 *
 * 1. input  => tokenizer     => tokens
 * 2. tokens => parser        => ast
 * 3. ast    => transformer   => newAst
 * 4. newAst => generator     => output
 */

function compiler(input) {
  let tokens = tokenizer(input);
  let ast = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // and simply return the output!
  return output;
}

// =====================YOU MADE IT=========================
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
