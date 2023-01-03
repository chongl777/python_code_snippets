from mypy.stubgen import generate_stubs,  parse_options, Options


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
        packages=[],
        files=['./ast_example.py'],
        verbose=True,
        quiet=False,
        export_less=False,
    )

generate_stubs(opts)


# gen = StubGenerator(
#     [],
#     include_private=False,
#     analyzed=True,
#     export_less=False,
# )

# mod.ast.accept(gen)
