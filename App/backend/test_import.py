import traceback
try:
    import main
    print('Import successful')
except Exception as e:
    with open('error.txt', 'w') as f:
        traceback.print_exc(file=f)
    print('Import failed, wrote to error.txt')
