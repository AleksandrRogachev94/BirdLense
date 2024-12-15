def filter_feeder_species(species_names):
    """
    Filter out bird species that are very unlikely to visit backyard feeders.
    Uses case-insensitive word boundary checking to ensure exact word matches.

    Args:
        species_names (list): List of bird species names

    Returns:
        list: Filtered list of species names likely to visit feeders
    """
    exclude_words = {
        'duck', 'goose', 'swan', 'hawk', 'eagle', 'falcon', 'owl',
        'vulture', 'turkey', 'grouse', 'quail', 'pheasant',
        'heron', 'egret', 'pelican', 'cormorant', 'gull', 'tern',
        'sandpiper', 'plover', 'rail', 'crane', 'stork',
        'penguin', 'albatross', 'shearwater', 'petrel',
        'loon', 'grebe', 'coot', 'osprey', 'kite'
    }

    def contains_excluded_word(name):
        # Split the name into lowercase words and check if any word is in exclude_words
        words = set(word.lower() for word in name.split())
        return not words.intersection(exclude_words)

    return [name for name in species_names if contains_excluded_word(name)]
