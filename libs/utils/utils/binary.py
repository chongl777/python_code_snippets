import pandas as pd
import tempfile


def df_to_excel_binary(df):
    with tempfile.NamedTemporaryFile(mode='w', delete=True) as fp:
        excel_writer = pd.ExcelWriter(
            fp.name, engine='xlsxwriter')

        df.to_excel(excel_writer, index=False)
        fp.file.close()
        excel_writer.save()
        with open(fp.name, 'rb') as f:
            df_binary = f.read()

    return df_binary
