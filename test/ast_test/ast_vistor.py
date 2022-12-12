import ast
import astunparse
from pprint import pprint


def main():
    # with open("ast_example.py", "r") as source:
    with open("ast_vistor.py", "r") as source:
        tree = ast.parse(source.read())

    analyzer = Analyzer()
    analyzer.visit(tree)
    analyzer.report()


class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self.stats = {"import": [], "from": []}

    def visit_Import(self, node):
        for alias in node.names:
            self.stats["import"].append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.stats["from"].append(alias.name)
        self.generic_visit(node)

    def report(self):
        pprint(self.stats)


if __name__ == "__main__":
    # main()
    import pdb; pdb.set_trace()
    tree = ast.parse("x=y+3; z=x+3", mode='exec')
    tree2 = compile("x=y+3", filename="<a>", mode='exec',
                    flags=ast.PyCF_ONLY_AST)

    astunparse.unparse(tree.body[1].value)
