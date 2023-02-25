from mypy.stubgen import generate_stubs,  parse_options, Options
import test_lib


# opts = parse_options([])

opts = Options(
    pyversion=(3, 7),
    no_import=False,
    doc_dir="",
    search_path=[''],
    interpreter='c:\\Users\\chong\\Anaconda3\\python.exe',
    ignore_errors=False,
    parse_only=False,
    include_private=False,
    output_dir='out',
    modules=[],
    # packages=[test_lib.__file__],
    packages=['test_lib'],
    # files=['./ast_example.py'],
    files=[],
    verbose=True,
    quiet=False,
    export_less=False,
)

# import pdb; pdb.set_trace()
if __name__ == '__main__':
    import pdb; pdb.set_trace()
    generate_stubs(opts)


# gen = StubGenerator(
#     [],
#     include_private=False,
#     analyzed=True,
#     export_less=False,
# )

# mod.ast.accept(gen)
