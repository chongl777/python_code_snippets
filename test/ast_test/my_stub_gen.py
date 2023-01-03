import ast
import astunparse

from pprint import pprint


EMPTY: str = "EMPTY"
FUNC: str = "FUNC"
CLASS: str = "CLASS"
EMPTY_CLASS: str = "EMPTY_CLASS"
VAR: str = "VAR"
NOT_IN_ALL: str = "NOT_IN_ALL"


class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self._indent = ""
        self._toplevel_names = []
        self._output = []
        self._state = None

    def is_top_level(self) -> bool:
        """Are we processing the top level of a file?"""
        return self._indent == ""

    def add(self, string: str) -> None:
        """Add text to generated stub."""
        self._output.append(string)

    def record_name(self, name):
        if self.is_top_level():
            self._toplevel_names.append(name)

    def output(self) -> str:
        """Return the text for the stub."""
        # imports = ""
        # if self._import_lines:
        #     imports += "".join(self._import_lines)
        # imports += "".join(self.import_tracker.import_lines())
        # if imports and self._output:
        #     imports += "\n"
        # return imports + "".join(self._output)
        return "".join(self._output)

    def visit_Import(self, node):
        for alias in node.names:
            id = alias.name
            as_id = alias.asname
            if as_id is None:
                target_name = id.split(".")[0]
            else:
                target_name = as_id
            self.record_name(target_name)

    def visit_ClassDef(self, node):
        # self.add(f"{self._indent}{'async ' if node.is_coroutine else ''}def {node.name}(")
        pass

    def visit_FunctionDef(self, node):
        # self.add(f"{self._indent}{'async ' if node.is_coroutine else ''}def {node.name}(")
        self.add(f"{self._indent}def {node.name}(")
        self.record_name(node.name)
        args: list[str] = []

        for i, args_ in enumerate(node.args.args):
            name = args_.arg
            annotated_type = args_.annotation.id
            is_self_arg = i == 0 and name == "self"
            is_cls_arg = i == 0 and name in ("cls", "kls")
            annotation = ""
            if annotated_type and not is_self_arg and not is_cls_arg:
                # Luckily, an argument explicitly annotated with "Any" has
                # type "UnboundType" and will not match.
                annotation = f": {annotated_type}"
            arg = name + annotation
            args.append(arg)

        retname = None
        if node.name != "__init__":
            retname = None

        retfield = ""
        if retname is not None:
            retfield = " -> " + retname

        self.add(", ".join(args))
        self.add(f"){retfield}: ...\n")
        self._state = FUNC


    # def visit_ImportFrom(self, node):
    #     for alias in node.names:
    #         self.stats["from"].append(alias.name)
    #     self.generic_visit(node)


def main():
    # with open("ast_example.py", "r") as source:
    with open("ast_example.py", "r") as source:
        aa = source.read()
        tree = ast.parse(aa)

    analyzer = Analyzer()

    for elm in tree.body:
        analyzer.visit(elm)
    return analyzer.output()


if __name__ == "__main__":
    print(main())
