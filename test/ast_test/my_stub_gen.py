import ast
from typing import List, Set
import astunparse

from pprint import pprint


EMPTY: str = "EMPTY"
FUNC: str = "FUNC"
CLASS: str = "CLASS"
EMPTY_CLASS: str = "EMPTY_CLASS"
VAR: str = "VAR"
NOT_IN_ALL: str = "NOT_IN_ALL"


def find_method_names(defs: List[ast.AST]) -> Set[str]:
    # TODO: Traverse into nested definitions
    result = set()
    for defn in defs:
        if isinstance(defn, ast.FunctionDef):
            result.add(defn.name)
        # elif isinstance(defn, Decorator):
        #     result.add(defn.func.name)
        # elif isinstance(defn, OverloadedFuncDef):
        #     for item in defn.items:
        #         result.update(find_method_names([item]))
    return result


class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self._indent = ""
        self._toplevel_names = []
        self._output = []
        self._vars: List[List[str]] = [[]]
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

    def get_base_types(self, cdef: ast.ClassDef) -> List[str]:
        base_types: List[str] = []
        for base in cdef.bases:
            pass
        return base_types

    def visit_Import(self, node):
        for alias in node.names:
            id = alias.name
            as_id = alias.asname
            if as_id is None:
                target_name = id.split(".")[0]
            else:
                target_name = as_id

            self._vars[-1].append(target_name)
            self.record_name(target_name)

    def visit_ClassDef(self, node):
        # self.add(f"{self._indent}{'async ' if node.is_coroutine else ''}def {node.name}(")
        self.method_names = find_method_names(node.body)
        sep: int | None = None
        if not self._indent and self._state != EMPTY:
            sep = len(self._output)
            self.add("\n")

        self.add(f"{self._indent}class {node.name}")
        self.record_name(node.name)
        # metaclass
        # node.keywords
        self.add(":\n")
        n = len(self._output)
        self._indent += "    "
        self._vars.append([])

        for o in node.body:
            self.visit(o)

        self._indent = self._indent[:-4]
        self._vars.pop()
        self._vars[-1].append(node.name)

        if len(self._output) == n:
            # when class is empty
            if self._state == EMPTY_CLASS and sep is not None:
                self._output[sep] = ""
            self._output[-1] = self._output[-1][:-1] + " ...\n"
            self._state = EMPTY_CLASS
        else:
            self._state = CLASS
        self.method_names = set()

    def visit_AnnAssign(self, node):
        self.add(f"{self._indent}{node.target.id}: {node.annotation.id}\n")

    def visit_FunctionDef(self, node):
        # self.add(f"{self._indent}{'async ' if node.is_coroutine else ''}def {node.name}(")
        self.add(f"{self._indent}def {node.name}(")
        self.record_name(node.name)
        args: list[str] = []

        for i, args_ in enumerate(node.args.args):
            name = args_.arg
            annotated_type = args_.annotation and args_.annotation.id
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
